import json
from unittest.mock import MagicMock, patch
import pytest
from pydantic import ValidationError

from backend.agent.tools import (
    APPROVED_TOOLS,
    AggregateMetricInput,
    CompareGroupsInput,
    GenerateChartInput,
    ProfileDataInput,
    TimeSeriesTrendInput,
    tool_aggregate_metric,
    tool_compare_groups,
    tool_generate_chart,
    tool_profile_data,
    tool_time_series_trend,
)
from backend.agent.workflow import (
    AgentState,
    build_agent_graph,
    initialize_llm,
    router_node,
    synthesizer_node,
    tool_execution_node,
)


# =====================================================================
# 1. TOOL SCHEMA & REGISTRY UNIT TESTS
# =====================================================================

class TestAgentToolSchemas:
    """Unit tests for Pydantic input schemas and registry of agent tools."""

    def test_profile_data_input_validation(self):
        valid = ProfileDataInput(dataset_id="ds_123")
        assert valid.dataset_id == "ds_123"

        with pytest.raises(ValidationError):
            ProfileDataInput()

    def test_aggregate_metric_input_defaults_and_validation(self):
        # Default parameters
        inp = AggregateMetricInput(
            dataset_id="ds_123",
            metric_col="revenue",
            group_by_cols=["region"],
        )
        assert inp.agg_func == "sum"
        assert inp.sort_desc is True
        assert inp.top_n == 10
        assert inp.filters is None

        # Custom parameters
        custom = AggregateMetricInput(
            dataset_id="ds_123",
            metric_col="profit",
            group_by_cols=["category", "sub_category"],
            agg_func="mean",
            sort_desc=False,
            top_n=5,
            filters={"region": "North"},
        )
        assert custom.agg_func == "mean"
        assert custom.top_n == 5
        assert custom.filters == {"region": "North"}

        # Missing required fields
        with pytest.raises(ValidationError):
            AggregateMetricInput(dataset_id="ds_123")

    def test_compare_groups_input_validation(self):
        inp = CompareGroupsInput(
            dataset_id="ds_123",
            group_col="category",
            metric_cols=["revenue", "profit"],
        )
        assert inp.agg_funcs == ["sum", "mean"]

        with pytest.raises(ValidationError):
            CompareGroupsInput(dataset_id="ds_123")

    def test_time_series_trend_input_validation(self):
        inp = TimeSeriesTrendInput(
            dataset_id="ds_123",
            date_col="order_date",
            metric_col="revenue",
        )
        assert inp.freq == "M"
        assert inp.agg_func == "sum"

        with pytest.raises(ValidationError):
            TimeSeriesTrendInput(dataset_id="ds_123")

    def test_generate_chart_input_validation(self):
        inp = GenerateChartInput(
            chart_type="bar",
            title="Sales by Region",
            x_col="region",
            y_col="revenue",
            data=[{"region": "North", "revenue": 100}],
        )
        assert inp.series_name is None

        with pytest.raises(ValidationError):
            GenerateChartInput(chart_type="bar")

    def test_approved_tools_registry(self):
        expected_tools = {
            "profile_data",
            "aggregate_metric",
            "compare_groups",
            "time_series_trend",
            "generate_chart",
        }
        assert set(APPROVED_TOOLS.keys()) == expected_tools

        for name, meta in APPROVED_TOOLS.items():
            assert callable(meta["function"])
            assert meta["schema"] is not None
            assert isinstance(meta["description"], str) and len(meta["description"]) > 10

    @patch("backend.agent.tools.data_service")
    def test_tool_functions_delegate_to_data_service(self, mock_ds):
        # 1. profile_data
        mock_ds.get_dataframe.return_value = "mock_df"
        mock_ds.profile_dataframe.return_value = {"rows": 10}
        res = tool_profile_data(ProfileDataInput(dataset_id="ds_1"))
        mock_ds.get_dataframe.assert_called_once_with("ds_1")
        mock_ds.profile_dataframe.assert_called_once_with("mock_df")
        assert res == {"rows": 10}

        # 2. aggregate_metric
        mock_ds.aggregate_metric.return_value = {"metric": "revenue"}
        res = tool_aggregate_metric(AggregateMetricInput(
            dataset_id="ds_1",
            metric_col="revenue",
            group_by_cols=["region"],
            agg_func="sum",
            sort_desc=True,
            top_n=10,
            filters=None,
        ))
        mock_ds.aggregate_metric.assert_called_once_with(
            dataset_id="ds_1",
            metric_col="revenue",
            group_by_cols=["region"],
            agg_func="sum",
            sort_desc=True,
            top_n=10,
            filters=None,
        )
        assert res == {"metric": "revenue"}

        # 3. compare_groups
        mock_ds.compare_groups.return_value = {"results": []}
        res = tool_compare_groups(CompareGroupsInput(
            dataset_id="ds_1",
            group_col="category",
            metric_cols=["revenue", "profit"],
            agg_funcs=["sum", "mean"],
        ))
        mock_ds.compare_groups.assert_called_once_with(
            dataset_id="ds_1",
            group_col="category",
            metric_cols=["revenue", "profit"],
            agg_funcs=["sum", "mean"],
        )
        assert res == {"results": []}

        # 4. time_series_trend
        mock_ds.time_series_trend.return_value = {"trend": []}
        res = tool_time_series_trend(TimeSeriesTrendInput(
            dataset_id="ds_1",
            date_col="order_date",
            metric_col="revenue",
            freq="M",
            agg_func="sum",
        ))
        mock_ds.time_series_trend.assert_called_once_with(
            dataset_id="ds_1",
            date_col="order_date",
            metric_col="revenue",
            freq="M",
            agg_func="sum",
        )
        assert res == {"trend": []}

        # 5. generate_chart
        mock_ds.generate_chart_spec.return_value = {"chart_type": "bar"}
        res = tool_generate_chart(GenerateChartInput(
            chart_type="bar",
            title="Chart",
            x_col="x",
            y_col="y",
            data=[],
            series_name="Series",
        ))
        mock_ds.generate_chart_spec.assert_called_once_with(
            chart_type="bar",
            title="Chart",
            x_col="x",
            y_col="y",
            data=[],
            series_name="Series",
        )
        assert res == {"chart_type": "bar"}


# =====================================================================
# 2. LLM INITIALIZATION UNIT TESTS
# =====================================================================

class TestInitializeLLM:
    """Unit tests for initialize_llm logic and fallback behavior."""

    def test_initialize_llm_returns_none_when_unconfigured(self):
        with patch("backend.agent.workflow.settings") as mock_settings:
            mock_settings.resolved_llm_provider.return_value = "none"
            mock_settings.GEMINI_API_KEY = None
            mock_settings.OPENAI_API_KEY = None
            llm = initialize_llm()
            assert llm is None

    def test_initialize_llm_gemini_path(self):
        with patch("backend.agent.workflow.settings") as mock_settings, \
             patch("langchain_google_genai.ChatGoogleGenerativeAI") as mock_gemini_cls:
            mock_settings.resolved_llm_provider.return_value = "gemini"
            mock_settings.GEMINI_API_KEY = "test-gemini-key"
            mock_settings.GEMINI_MODEL = "gemini-1.5-flash"
            mock_settings.LLM_TEMPERATURE = 0.1

            mock_client = MagicMock()
            mock_gemini_cls.return_value = mock_client

            llm = initialize_llm()
            mock_gemini_cls.assert_called_once_with(
                model="gemini-1.5-flash",
                google_api_key="test-gemini-key",
                temperature=0.1,
            )
            assert llm == mock_client

    def test_initialize_llm_openai_path(self):
        with patch("backend.agent.workflow.settings") as mock_settings, \
             patch("langchain_openai.ChatOpenAI") as mock_openai_cls:
            mock_settings.resolved_llm_provider.return_value = "openai"
            mock_settings.OPENAI_API_KEY = "test-openai-key"
            mock_settings.OPENAI_MODEL = "gpt-4o-mini"
            mock_settings.LLM_TEMPERATURE = 0.2

            mock_client = MagicMock()
            mock_openai_cls.return_value = mock_client

            llm = initialize_llm()
            mock_openai_cls.assert_called_once_with(
                model="gpt-4o-mini",
                openai_api_key="test-openai-key",
                temperature=0.2,
            )
            assert llm == mock_client

    def test_initialize_llm_exception_handling(self):
        with patch("backend.agent.workflow.settings") as mock_settings, \
             patch("langchain_google_genai.ChatGoogleGenerativeAI", side_effect=Exception("API key invalid")):
            mock_settings.resolved_llm_provider.return_value = "gemini"
            mock_settings.GEMINI_API_KEY = "invalid-key"
            llm = initialize_llm()
            assert llm is None


# =====================================================================
# 3. ROUTER NODE UNIT TESTS
# =====================================================================

class TestRouterNode:
    """Unit tests for query classification and tool planning in router_node."""

    @pytest.fixture
    def base_state(self) -> AgentState:
        return {
            "dataset_id": "ds_test_001",
            "user_query": "",
            "dataset_profile": {
                "numeric_columns": ["revenue", "profit", "quantity"],
                "categorical_columns": ["region", "category", "sales_channel"],
                "datetime_columns": ["order_date"],
                "categorical_stats": {
                    "sales_channel": [{"value": "Online", "count": 12}, {"value": "Retail", "count": 8}],
                    "region": [{"value": "North", "count": 6}, {"value": "South", "count": 5}],
                },
            },
            "intent": "",
            "tool_calls": [],
            "tool_results": [],
            "chart_spec": None,
            "rag_sources": [],
            "final_response": "",
        }

    @pytest.mark.parametrize("query_text", [
        "Check for missing and null values in the dataset",
        "How many duplicate rows exist?",
        "Give me a dataset profile and schema overview",
        "Perform a full data health audit",
        "Detect any unusual outliers or anomalies in the numbers",
    ])
    def test_router_profile_intent_keywords(self, base_state, query_text):
        base_state["user_query"] = query_text
        state = router_node(base_state)

        assert state["intent"] == "profile"
        assert len(state["tool_calls"]) == 1
        assert state["tool_calls"][0]["tool"] == "profile_data"
        assert state["tool_calls"][0]["args"] == {"dataset_id": "ds_test_001"}

    def test_router_time_series_intent_default_metric(self, base_state):
        base_state["user_query"] = "Show monthly trend over time"
        state = router_node(base_state)

        assert state["intent"] == "time_series"
        assert len(state["tool_calls"]) == 1
        call = state["tool_calls"][0]
        assert call["tool"] == "time_series_trend"
        assert call["args"]["date_col"] == "order_date"
        assert call["args"]["metric_col"] == "revenue"
        assert call["args"]["freq"] == "M"
        assert call["args"]["agg_func"] == "sum"

    def test_router_time_series_intent_specific_metric(self, base_state):
        base_state["user_query"] = "What is the timeline of profit by date?"
        state = router_node(base_state)

        assert state["intent"] == "time_series"
        assert state["tool_calls"][0]["args"]["metric_col"] == "profit"

    def test_router_comparison_intent(self, base_state):
        base_state["user_query"] = "Compare revenue and profit across category"
        state = router_node(base_state)

        assert state["intent"] == "comparison"
        assert len(state["tool_calls"]) == 1
        call = state["tool_calls"][0]
        assert call["tool"] == "compare_groups"
        assert call["args"]["group_col"] == "category"
        assert call["args"]["metric_cols"] == ["revenue", "profit"]

    def test_router_aggregation_sum_default(self, base_state):
        base_state["user_query"] = "What is the total revenue by region?"
        state = router_node(base_state)

        assert state["intent"] == "aggregation"
        call = state["tool_calls"][0]
        assert call["tool"] == "aggregate_metric"
        assert call["args"]["metric_col"] == "revenue"
        assert call["args"]["group_by_cols"] == ["region"]
        assert call["args"]["agg_func"] == "sum"
        assert call["args"]["filters"] is None

    def test_router_aggregation_mean_and_count(self, base_state):
        # Mean test
        base_state["user_query"] = "What is the average profit by region?"
        state_mean = router_node(base_state)
        assert state_mean["tool_calls"][0]["args"]["agg_func"] == "mean"
        assert state_mean["tool_calls"][0]["args"]["metric_col"] == "profit"

        # Count test
        base_state["user_query"] = "How many orders by category?"
        state_count = router_node(base_state)
        assert state_count["tool_calls"][0]["args"]["agg_func"] == "count"

    def test_router_aggregation_with_filter_detection(self, base_state):
        base_state["user_query"] = "What is the revenue by region for Online orders?"
        state = router_node(base_state)

        assert state["intent"] == "aggregation"
        call = state["tool_calls"][0]
        assert call["args"]["filters"] == {"sales_channel": "Online"}

    def test_router_fallback_to_profile_when_no_numeric_columns(self, base_state):
        base_state["dataset_profile"]["numeric_columns"] = []
        base_state["user_query"] = "Show me numbers by region"
        state = router_node(base_state)

        assert state["intent"] == "profile"
        assert state["tool_calls"][0]["tool"] == "profile_data"

    @patch("backend.agent.workflow.document_rag_service")
    def test_router_triggers_rag_on_reference_keywords(self, mock_rag, base_state):
        mock_rag.search_context.return_value = [
            {"filename": "kpi_definition.pdf", "page_number": 2, "snippet": "Revenue definition"}
        ]
        base_state["user_query"] = "What is the policy or standard definition for revenue KPI?"
        state = router_node(base_state)

        mock_rag.search_context.assert_called_once_with(
            query=base_state["user_query"],
            dataset_id="ds_test_001",
        )
        assert len(state["rag_sources"]) == 1
        assert state["rag_sources"][0]["filename"] == "kpi_definition.pdf"


# =====================================================================
# 4. TOOL EXECUTION NODE UNIT TESTS
# =====================================================================

class TestToolExecutionNode:
    """Unit tests for tool validation, execution, and automatic chart spec generation."""

    def test_rejects_unapproved_tool(self):
        state: AgentState = {
            "dataset_id": "ds_1",
            "user_query": "hack the system",
            "dataset_profile": {},
            "intent": "unknown",
            "tool_calls": [{"tool": "unauthorized_tool", "args": {}}],
            "tool_results": [],
            "chart_spec": None,
            "rag_sources": [],
            "final_response": "",
        }

        new_state = tool_execution_node(state)
        assert len(new_state["tool_results"]) == 0
        assert new_state["chart_spec"] is None

    @patch("backend.agent.workflow.data_service")
    @patch("backend.agent.tools.data_service")
    def test_successful_tool_execution_with_pie_chart(self, mock_tools_ds, mock_wf_ds):
        mock_tools_ds.aggregate_metric.return_value = {
            "metric": "revenue",
            "value_column": "revenue",
            "group_by": ["region"],
            "agg_func": "sum",
            "results": [
                {"region": "North", "revenue": 100.0},
                {"region": "South", "revenue": 80.0},
                {"region": "East", "revenue": 50.0},
            ],
            "summary": {"overall_sum": 230.0, "total_groups": 3},
        }
        mock_wf_ds.generate_chart_spec.return_value = {
            "chart_type": "pie",
            "title": "Revenue by Region",
        }

        state: AgentState = {
            "dataset_id": "ds_1",
            "user_query": "revenue by region",
            "dataset_profile": {},
            "intent": "aggregation",
            "tool_calls": [{
                "tool": "aggregate_metric",
                "args": {
                    "dataset_id": "ds_1",
                    "metric_col": "revenue",
                    "group_by_cols": ["region"],
                },
            }],
            "tool_results": [],
            "chart_spec": None,
            "rag_sources": [],
            "final_response": "",
        }

        new_state = tool_execution_node(state)
        assert len(new_state["tool_results"]) == 1
        assert new_state["tool_results"][0]["status"] == "success"
        assert new_state["chart_spec"] is not None

        # Verify pie chart was selected (<= 5 results and sum)
        mock_wf_ds.generate_chart_spec.assert_called_once()
        call_kwargs = mock_wf_ds.generate_chart_spec.call_args[1]
        assert call_kwargs["chart_type"] == "pie"

    @patch("backend.agent.workflow.data_service")
    @patch("backend.agent.tools.data_service")
    def test_successful_tool_execution_with_bar_chart(self, mock_tools_ds, mock_wf_ds):
        mock_tools_ds.aggregate_metric.return_value = {
            "metric": "revenue",
            "value_column": "revenue",
            "group_by": ["category"],
            "agg_func": "sum",
            "results": [{"category": f"Cat_{i}", "revenue": 10.0 * i} for i in range(7)],
            "summary": {"overall_sum": 210.0, "total_groups": 7},
        }
        mock_wf_ds.generate_chart_spec.return_value = {
            "chart_type": "bar",
            "title": "Revenue by Category",
        }

        state: AgentState = {
            "dataset_id": "ds_1",
            "user_query": "revenue by category",
            "dataset_profile": {},
            "intent": "aggregation",
            "tool_calls": [{
                "tool": "aggregate_metric",
                "args": {
                    "dataset_id": "ds_1",
                    "metric_col": "revenue",
                    "group_by_cols": ["category"],
                },
            }],
            "tool_results": [],
            "chart_spec": None,
            "rag_sources": [],
            "final_response": "",
        }

        new_state = tool_execution_node(state)
        call_kwargs = mock_wf_ds.generate_chart_spec.call_args[1]
        assert call_kwargs["chart_type"] == "bar"

    @patch("backend.agent.workflow.data_service")
    @patch("backend.agent.tools.data_service")
    def test_successful_time_series_generates_line_chart(self, mock_tools_ds, mock_wf_ds):
        mock_tools_ds.time_series_trend.return_value = {
            "metric_col": "revenue",
            "date_col": "order_date",
            "frequency": "Monthly",
            "trend": [
                {"period": "2024-01", "revenue": 100.0, "pct_change": 0},
                {"period": "2024-02", "revenue": 150.0, "pct_change": 50.0},
            ],
        }
        mock_wf_ds.generate_chart_spec.return_value = {
            "chart_type": "line",
            "title": "Monthly Revenue Trend",
        }

        state: AgentState = {
            "dataset_id": "ds_1",
            "user_query": "trend",
            "dataset_profile": {},
            "intent": "time_series",
            "tool_calls": [{
                "tool": "time_series_trend",
                "args": {
                    "dataset_id": "ds_1",
                    "date_col": "order_date",
                    "metric_col": "revenue",
                },
            }],
            "tool_results": [],
            "chart_spec": None,
            "rag_sources": [],
            "final_response": "",
        }

        new_state = tool_execution_node(state)
        assert new_state["chart_spec"]["chart_type"] == "line"

    @patch("backend.agent.tools.data_service")
    def test_handles_tool_execution_exception_gracefully(self, mock_tools_ds):
        mock_tools_ds.aggregate_metric.side_effect = ValueError("Column 'unknown' not found in dataset")

        state: AgentState = {
            "dataset_id": "ds_1",
            "user_query": "bad query",
            "dataset_profile": {},
            "intent": "aggregation",
            "tool_calls": [{
                "tool": "aggregate_metric",
                "args": {
                    "dataset_id": "ds_1",
                    "metric_col": "unknown",
                    "group_by_cols": ["region"],
                },
            }],
            "tool_results": [],
            "chart_spec": None,
            "rag_sources": [],
            "final_response": "",
        }

        new_state = tool_execution_node(state)
        assert len(new_state["tool_results"]) == 1
        assert new_state["tool_results"][0]["status"] == "error"
        assert "Column 'unknown' not found" in new_state["tool_results"][0]["error"]
        assert new_state["chart_spec"] is None


# =====================================================================
# 5. SYNTHESIZER NODE UNIT TESTS
# =====================================================================

class TestSynthesizerNode:
    """Unit tests for synthesizer_node (deterministic formatting & LLM synthesis)."""

    @patch("backend.agent.workflow.initialize_llm", return_value=None)
    def test_deterministic_aggregate_metric_multiple_groups(self, _mock_llm):
        state: AgentState = {
            "dataset_id": "ds_1",
            "user_query": "revenue by region",
            "dataset_profile": {},
            "intent": "aggregation",
            "tool_calls": [],
            "tool_results": [{
                "tool": "aggregate_metric",
                "status": "success",
                "output": {
                    "metric": "revenue",
                    "value_column": "revenue",
                    "group_by": ["region"],
                    "agg_func": "sum",
                    "summary": {
                        "overall_sum": 5000.50,
                        "total_groups": 3,
                        "highest_group": {"region": "North", "revenue": 3000.50},
                        "lowest_group": {"region": "South", "revenue": 800.00},
                    },
                },
            }],
            "chart_spec": None,
            "rag_sources": [],
            "final_response": "",
        }

        res_state = synthesizer_node(state)
        text = res_state["final_response"]
        assert "### Analysis: Revenue by Region" in text
        assert "$5,000.50" in text
        assert "Top Performer**: **North** with **$3,000.50**" in text
        assert "Lowest Performer**: **South** with **$800.00**" in text
        assert "Computed deterministically using Pandas `sum` aggregation." in text

    @patch("backend.agent.workflow.initialize_llm", return_value=None)
    def test_deterministic_aggregate_metric_single_group_omits_lowest(self, _mock_llm):
        state: AgentState = {
            "dataset_id": "ds_1",
            "user_query": "revenue by region",
            "dataset_profile": {},
            "intent": "aggregation",
            "tool_calls": [],
            "tool_results": [{
                "tool": "aggregate_metric",
                "status": "success",
                "output": {
                    "metric": "revenue",
                    "value_column": "revenue",
                    "group_by": ["region"],
                    "agg_func": "sum",
                    "summary": {
                        "overall_sum": 1000.0,
                        "total_groups": 1,
                        "highest_group": {"region": "Global", "revenue": 1000.0},
                        "lowest_group": {"region": "Global", "revenue": 1000.0},
                    },
                },
            }],
            "chart_spec": None,
            "rag_sources": [],
            "final_response": "",
        }

        res_state = synthesizer_node(state)
        text = res_state["final_response"]
        assert "Top Performer" in text
        # Lowest performer shouldn't be duplicated when total_groups <= 1
        assert "Lowest Performer" not in text

    @patch("backend.agent.workflow.initialize_llm", return_value=None)
    def test_deterministic_time_series_trend(self, _mock_llm):
        state: AgentState = {
            "dataset_id": "ds_1",
            "user_query": "monthly trend",
            "dataset_profile": {},
            "intent": "time_series",
            "tool_calls": [],
            "tool_results": [{
                "tool": "time_series_trend",
                "status": "success",
                "output": {
                    "metric_col": "revenue",
                    "frequency": "Monthly",
                    "trend": [
                        {"period": "2024-01", "revenue": 1000.0, "pct_change": 0},
                        {"period": "2024-02", "revenue": 1250.0, "pct_change": 25.0},
                        {"period": "2024-03", "revenue": 1100.0, "pct_change": -12.0},
                    ],
                },
            }],
            "chart_spec": None,
            "rag_sources": [],
            "final_response": "",
        }

        res_state = synthesizer_node(state)
        text = res_state["final_response"]
        assert "### Time Series Trend: Revenue" in text
        assert "2024-01**: **$1,000.00** (0% vs prior)" in text
        assert "2024-02**: **$1,250.00** (+25.0% vs prior)" in text
        assert "2024-03**: **$1,100.00** (-12.0% vs prior)" in text

    @patch("backend.agent.workflow.initialize_llm", return_value=None)
    def test_deterministic_compare_groups(self, _mock_llm):
        state: AgentState = {
            "dataset_id": "ds_1",
            "user_query": "compare categories",
            "dataset_profile": {},
            "intent": "comparison",
            "tool_calls": [],
            "tool_results": [{
                "tool": "compare_groups",
                "status": "success",
                "output": {
                    "group_column": "category",
                    "results": [
                        {"category": "Electronics", "revenue_sum": 5000, "profit_mean": 250},
                        {"category": "Apparel", "revenue_sum": 3000, "profit_mean": 120},
                    ],
                },
            }],
            "chart_spec": None,
            "rag_sources": [],
            "final_response": "",
        }

        res_state = synthesizer_node(state)
        text = res_state["final_response"]
        assert "### Comparative Group Analysis (Category)" in text
        assert "Electronics**: revenue sum: 5000, profit mean: 250" in text
        assert "Apparel**: revenue sum: 3000, profit mean: 120" in text

    @patch("backend.agent.workflow.initialize_llm", return_value=None)
    def test_deterministic_profile_clean_and_missing(self, _mock_llm):
        # 1. 100% Clean dataset
        clean_state: AgentState = {
            "dataset_id": "ds_1",
            "user_query": "profile",
            "dataset_profile": {},
            "intent": "profile",
            "tool_calls": [],
            "tool_results": [{
                "tool": "profile_data",
                "status": "success",
                "output": {
                    "rows": 100,
                    "columns": 5,
                    "memory_mb": 0.05,
                    "duplicate_rows": 0,
                    "duplicate_pct": 0.0,
                    "missing_values_report": [],
                },
            }],
            "chart_spec": None,
            "rag_sources": [],
            "final_response": "",
        }
        res_clean = synthesizer_node(clean_state)
        assert "100 rows × 5 columns" in res_clean["final_response"]
        assert "0 missing values across all columns (100% clean)." in res_clean["final_response"]

        # 2. Dataset with missing values
        dirty_state = clean_state.copy()
        dirty_state["tool_results"] = [{
            "tool": "profile_data",
            "status": "success",
            "output": {
                "rows": 100,
                "columns": 5,
                "memory_mb": 0.05,
                "duplicate_rows": 2,
                "duplicate_pct": 2.0,
                "missing_values_report": [{"column": "revenue", "missing_count": 5}],
            },
        }]
        res_dirty = synthesizer_node(dirty_state)
        assert "Missing Values Detected**: revenue (5 nulls)" in res_dirty["final_response"]

    @patch("backend.agent.workflow.initialize_llm", return_value=None)
    def test_deterministic_synthesis_with_rag_citations(self, _mock_llm):
        state: AgentState = {
            "dataset_id": "ds_1",
            "user_query": "what is the policy?",
            "dataset_profile": {},
            "intent": "profile",
            "tool_calls": [],
            "tool_results": [],
            "chart_spec": None,
            "rag_sources": [
                {"filename": "Corporate_Rules.pdf", "page_number": 4, "snippet": "Target margin is 25%."}
            ],
            "final_response": "",
        }

        res_state = synthesizer_node(state)
        text = res_state["final_response"]
        assert "### Reference Documentation Citations" in text
        assert "Corporate_Rules.pdf" in text
        assert "Page 4" in text
        assert "Target margin is 25%." in text

    @patch("backend.agent.workflow.initialize_llm", return_value=None)
    def test_empty_tool_results_fallback(self, _mock_llm):
        state: AgentState = {
            "dataset_id": "ds_1",
            "user_query": "hello",
            "dataset_profile": {},
            "intent": "",
            "tool_calls": [],
            "tool_results": [],
            "chart_spec": None,
            "rag_sources": [],
            "final_response": "",
        }

        res_state = synthesizer_node(state)
        assert res_state["final_response"] == "No matching data analysis tool could be executed for this query."

    def test_llm_synthesis_flow_and_guardrail_prompt(self):
        mock_llm = MagicMock()
        mock_response = MagicMock()
        mock_response.content = "Executive Summary: North region led revenue at $1,915.07."
        mock_llm.invoke.return_value = mock_response

        with patch("backend.agent.workflow.initialize_llm", return_value=mock_llm):
            state: AgentState = {
                "dataset_id": "ds_1",
                "user_query": "Which region was top?",
                "dataset_profile": {},
                "intent": "aggregation",
                "tool_calls": [],
                "tool_results": [{
                    "tool": "aggregate_metric",
                    "output": {"summary": {"highest_group": {"region": "North", "revenue": 1915.07}}},
                }],
                "chart_spec": None,
                "rag_sources": [],
                "final_response": "",
            }

            res_state = synthesizer_node(state)
            assert res_state["final_response"] == "Executive Summary: North region led revenue at $1,915.07."
            mock_llm.invoke.assert_called_once()
            call_args = mock_llm.invoke.call_args[0][0]
            # Verify system message has strict guardrail
            assert "STRICT GUARDRAILS" in call_args[0].content
            assert "NEVER invent, extrapolate, or hallucinate" in call_args[0].content

    def test_llm_synthesis_failure_falls_back_to_deterministic(self):
        mock_llm = MagicMock()
        mock_llm.invoke.side_effect = RuntimeError("API rate limit exceeded")

        with patch("backend.agent.workflow.initialize_llm", return_value=mock_llm):
            state: AgentState = {
                "dataset_id": "ds_1",
                "user_query": "revenue by region",
                "dataset_profile": {},
                "intent": "aggregation",
                "tool_calls": [],
                "tool_results": [{
                    "tool": "aggregate_metric",
                    "output": {
                        "metric": "revenue",
                        "value_column": "revenue",
                        "group_by": ["region"],
                        "agg_func": "sum",
                        "summary": {
                            "overall_sum": 500.0,
                            "total_groups": 1,
                            "highest_group": {"region": "North", "revenue": 500.0},
                        },
                    },
                }],
                "chart_spec": None,
                "rag_sources": [],
                "final_response": "",
            }

            res_state = synthesizer_node(state)
            # Successfully degraded to deterministic response without raising error
            assert "### Analysis: Revenue by Region" in res_state["final_response"]
            assert "$500.00" in res_state["final_response"]


# =====================================================================
# 6. GRAPH STRUCTURE UNIT TESTS
# =====================================================================

class TestAgentGraphWorkflow:
    """Unit tests for LangGraph graph construction and execution flow."""

    def test_graph_compilation_and_nodes(self):
        graph = build_agent_graph()
        assert graph is not None

    def test_end_to_end_unit_execution_with_profile(self):
        graph = build_agent_graph()
        state: AgentState = {
            "dataset_id": "mock_ds_id",
            "user_query": "Give me a data health audit",
            "dataset_profile": {
                "numeric_columns": ["col_a"],
                "categorical_columns": ["col_b"],
                "datetime_columns": [],
            },
            "intent": "",
            "tool_calls": [],
            "tool_results": [],
            "chart_spec": None,
            "rag_sources": [],
            "final_response": "",
        }

        with patch("backend.agent.tools.data_service") as mock_ds, \
             patch("backend.agent.workflow.initialize_llm", return_value=None):
            mock_ds.get_dataframe.return_value = "df"
            mock_ds.profile_dataframe.return_value = {
                "rows": 50,
                "columns": 2,
                "memory_mb": 0.01,
                "duplicate_rows": 0,
                "duplicate_pct": 0.0,
                "missing_values_report": [],
            }

            result = graph.invoke(state)

            assert result["intent"] == "profile"
            assert len(result["tool_calls"]) == 1
            assert result["tool_calls"][0]["tool"] == "profile_data"
            assert len(result["tool_results"]) == 1
            assert result["tool_results"][0]["status"] == "success"
            assert "50 rows × 2 columns" in result["final_response"]
            assert "100% clean" in result["final_response"]
