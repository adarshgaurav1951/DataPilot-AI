import pytest
from backend.agent.workflow import AgentState, agent_graph, router_node, synthesizer_node
from backend.db.database import init_db
from backend.services.data_service import data_service


# =====================================================================
# TDD TEST SUITE: ADVANCED RANKING, EXTENDED AGGREGATIONS & OUTLIER REPORTING
# =====================================================================

class TestTDDAdvancedAgentFeatures:
    """
    Test-Driven Development (TDD) tests for new capabilities:
    1. Dynamic Top/Bottom N extraction & sorting (sort_desc=False for bottom queries)
    2. Extended aggregation functions: 'median', 'min', 'max'
    3. Statistical anomaly & outlier reporting in agent synthesizer
    """

    @pytest.fixture
    def base_state(self) -> AgentState:
        return {
            "dataset_id": "ds_tdd_001",
            "user_query": "",
            "dataset_profile": {
                "numeric_columns": ["revenue", "profit", "quantity"],
                "categorical_columns": ["region", "category", "sales_channel"],
                "datetime_columns": ["order_date"],
                "categorical_stats": {
                    "region": [{"value": "North", "count": 6}, {"value": "South", "count": 5}],
                    "sales_channel": [{"value": "Online", "count": 12}],
                },
            },
            "intent": "",
            "tool_calls": [],
            "tool_results": [],
            "chart_spec": None,
            "rag_sources": [],
            "final_response": "",
        }

    # -----------------------------------------------------------------
    # Feature A: Dynamic N extraction & Bottom / Ascending ranking
    # -----------------------------------------------------------------

    def test_tdd_router_extracts_custom_top_n(self, base_state):
        base_state["user_query"] = "Show top 3 regions by revenue"
        state = router_node(base_state)

        assert state["intent"] == "aggregation"
        call = state["tool_calls"][0]
        assert call["tool"] == "aggregate_metric"
        assert call["args"]["top_n"] == 3
        assert call["args"]["sort_desc"] is True

    def test_tdd_router_bottom_ranking_sort_desc_false(self, base_state):
        base_state["user_query"] = "Show bottom 5 categories by revenue"
        state = router_node(base_state)

        assert state["intent"] == "aggregation"
        call = state["tool_calls"][0]
        assert call["tool"] == "aggregate_metric"
        assert call["args"]["top_n"] == 5
        assert call["args"]["sort_desc"] is False

    @pytest.mark.parametrize("query_text", [
        "Show least revenue by region",
        "Which product had the lowest sales?",
        "Worst performing categories by revenue",
    ])
    def test_tdd_router_lowest_queries_set_sort_desc_false(self, base_state, query_text):
        base_state["user_query"] = query_text
        state = router_node(base_state)

        assert state["intent"] == "aggregation"
        call = state["tool_calls"][0]
        assert call["args"]["sort_desc"] is False

    # -----------------------------------------------------------------
    # Feature B: Extended aggregation functions (median, min, max)
    # -----------------------------------------------------------------

    def test_tdd_router_supports_median_agg_func(self, base_state):
        base_state["user_query"] = "What is the median revenue by region?"
        state = router_node(base_state)

        assert state["intent"] == "aggregation"
        call = state["tool_calls"][0]
        assert call["args"]["agg_func"] == "median"

    def test_tdd_router_supports_min_and_max_agg_func(self, base_state):
        # Minimum
        base_state["user_query"] = "What is the minimum profit by region?"
        state_min = router_node(base_state)
        assert state_min["tool_calls"][0]["args"]["agg_func"] == "min"

        # Maximum
        base_state["user_query"] = "What is the maximum revenue by category?"
        state_max = router_node(base_state)
        assert state_max["tool_calls"][0]["args"]["agg_func"] == "max"

    # -----------------------------------------------------------------
    # Feature C: Outlier / Anomaly Reporting in Synthesizer
    # -----------------------------------------------------------------

    def test_tdd_synthesizer_reports_outliers_when_present(self, base_state):
        base_state["tool_results"] = [{
            "tool": "profile_data",
            "status": "success",
            "output": {
                "rows": 100,
                "columns": 5,
                "memory_mb": 0.05,
                "duplicate_rows": 0,
                "duplicate_pct": 0.0,
                "missing_values_report": [],
                "outliers_report": {
                    "revenue": {
                        "outlier_count": 2,
                        "outlier_pct": 2.0,
                        "sample_outliers": [5500.0, 6200.0],
                    }
                },
            },
        }]

        state = synthesizer_node(base_state)
        text = state["final_response"]
        assert "Statistical Outliers Flagged" in text
        assert "revenue: 2 outliers (2.0% of rows" in text

    def test_tdd_synthesizer_reports_zero_outliers_when_none(self, base_state):
        base_state["tool_results"] = [{
            "tool": "profile_data",
            "status": "success",
            "output": {
                "rows": 100,
                "columns": 5,
                "memory_mb": 0.05,
                "duplicate_rows": 0,
                "duplicate_pct": 0.0,
                "missing_values_report": [],
                "outliers_report": {},
            },
        }]

        state = synthesizer_node(base_state)
        text = state["final_response"]
        assert "Statistical Outliers**: 0 anomalies detected" in text

    # -----------------------------------------------------------------
    # Integration TDD Test: Bottom-N ranking on real sample dataset
    # -----------------------------------------------------------------

    def test_tdd_end_to_end_bottom_n_ranking_integration(self):
        init_db()
        with open("data/sample_sales.csv", "rb") as f:
            content = f.read()
        dataset_id, profile = data_service.load_and_profile_file(content, "sample_sales.csv")

        initial_state = {
            "dataset_id": dataset_id,
            "user_query": "Show bottom 2 regions by revenue",
            "dataset_profile": profile,
            "intent": "",
            "tool_calls": [],
            "tool_results": [],
            "chart_spec": None,
            "rag_sources": [],
            "final_response": "",
        }

        result = agent_graph.invoke(initial_state)

        assert result["intent"] == "aggregation"
        assert result["tool_calls"][0]["args"]["top_n"] == 2
        assert result["tool_calls"][0]["args"]["sort_desc"] is False

        # First result should be the lowest revenue region
        results = result["tool_results"][0]["output"]["results"]
        assert len(results) == 2
        assert results[0]["revenue"] <= results[1]["revenue"]
