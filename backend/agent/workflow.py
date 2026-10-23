import json
import os
import re
from typing import Any, Dict, List, Optional, TypedDict
from langgraph.graph import END, StateGraph
from backend.agent.tools import (
    APPROVED_TOOLS,
    AggregateMetricInput,
    CompareGroupsInput,
    GenerateChartInput,
    ProfileDataInput,
    TimeSeriesTrendInput,
)
from backend.core.config import get_settings
from backend.core.logging import logger
from backend.rag.document_service import document_rag_service
from backend.services.data_service import data_service

settings = get_settings()


class AgentState(TypedDict):
    dataset_id: str
    user_query: str
    dataset_profile: Dict[str, Any]
    intent: str
    tool_calls: List[Dict[str, Any]]
    tool_results: List[Dict[str, Any]]
    chart_spec: Optional[Dict[str, Any]]
    rag_sources: List[Dict[str, Any]]
    final_response: str


def initialize_llm():
    """Initializes LLM client (Google Gemini or OpenAI) if API key is configured."""
    provider = settings.resolved_llm_provider()
    try:
        if provider == "gemini" and settings.GEMINI_API_KEY:
            from langchain_google_genai import ChatGoogleGenerativeAI
            return ChatGoogleGenerativeAI(
                model=settings.GEMINI_MODEL,
                google_api_key=settings.GEMINI_API_KEY,
                temperature=settings.LLM_TEMPERATURE,
            )
        elif provider == "openai" and settings.OPENAI_API_KEY:
            from langchain_openai import ChatOpenAI
            return ChatOpenAI(
                model=settings.OPENAI_MODEL,
                openai_api_key=settings.OPENAI_API_KEY,
                temperature=settings.LLM_TEMPERATURE,
            )
    except Exception as e:
        logger.warning(f"Could not initialize LLM client: {e}. Falling back to deterministic synthesizer.")
    return None


def router_node(state: AgentState) -> AgentState:
    """Classifies user query and plans the necessary deterministic tool executions."""
    query = state["user_query"].lower()
    profile = state["dataset_profile"]
    dataset_id = state["dataset_id"]

    num_cols = profile.get("numeric_columns", [])
    cat_cols = profile.get("categorical_columns", [])
    date_cols = profile.get("datetime_columns", [])

    tool_calls: List[Dict[str, Any]] = []

    # 1. Profile / Missing / Duplicates / Outliers / Overview intent
    if any(k in query for k in ["missing", "null", "duplicate", "profile", "overview", "schema", "shape", "data health", "audit", "outlier", "unusual", "anomaly"]):
        tool_calls.append({
            "tool": "profile_data",
            "args": {"dataset_id": dataset_id},
        })
        state["intent"] = "profile"

    # 2. Time series / Trend intent
    elif any(k in query for k in ["trend", "month", "monthly", "over time", "quarter", "timeline", "date"]) and date_cols:
        target_metric = "revenue" if "revenue" in num_cols else (num_cols[0] if num_cols else "count")
        for col in num_cols:
            if col.lower() in query:
                target_metric = col
                break
        date_col = date_cols[0]
        tool_calls.append({
            "tool": "time_series_trend",
            "args": {
                "dataset_id": dataset_id,
                "date_col": date_col,
                "metric_col": target_metric,
                "freq": "M",
                "agg_func": "sum",
            },
        })
        state["intent"] = "time_series"

    # 3. Multi-group comparison intent
    elif any(k in query for k in ["compare", "comparison", "versus", "vs", "breakdown"]) and len(num_cols) >= 2 and cat_cols:
        group_col = cat_cols[0]
        for col in cat_cols:
            if col.lower() in query:
                group_col = col
                break
        tool_calls.append({
            "tool": "compare_groups",
            "args": {
                "dataset_id": dataset_id,
                "group_col": group_col,
                "metric_cols": num_cols[:2],
                "agg_funcs": ["sum", "mean"],
            },
        })
        state["intent"] = "comparison"

    # 4. Standard Aggregation (revenue by region, sales by product, etc.)
    else:
        target_group = cat_cols[0] if cat_cols else "region"
        for col in cat_cols:
            if col.lower() in query or col.lower().rstrip("s") in query:
                target_group = col
                break

        target_metric = "revenue" if "revenue" in num_cols else (num_cols[0] if num_cols else None)
        for col in num_cols:
            if col.lower() in query or col.lower().rstrip("s") in query:
                target_metric = col
                break

        agg_func = "sum"
        if "average" in query or "mean" in query or "avg" in query:
            agg_func = "mean"
        elif "count" in query or "how many" in query or "number of" in query:
            agg_func = "count"
        elif "highest" in query or "max" in query or "most" in query:
            agg_func = "sum"
        elif "lowest" in query or "min" in query or "least" in query:
            agg_func = "sum"

        # Check for channel/category filters
        filters = {}
        for c in cat_cols:
            top_vals = [item["value"] for item in profile.get("categorical_stats", {}).get(c, [])]
            for v in top_vals:
                if v.lower() in query:
                    filters[c] = v

        if target_metric:
            tool_calls.append({
                "tool": "aggregate_metric",
                "args": {
                    "dataset_id": dataset_id,
                    "metric_col": target_metric,
                    "group_by_cols": [target_group],
                    "agg_func": agg_func,
                    "sort_desc": True,
                    "top_n": 10,
                    "filters": filters if filters else None,
                },
            })
            state["intent"] = "aggregation"
        else:
            tool_calls.append({
                "tool": "profile_data",
                "args": {"dataset_id": dataset_id},
            })
            state["intent"] = "profile"

    # Check for reference doc query
    if any(k in query for k in ["rule", "policy", "definition", "dictionary", "kpi", "formula", "standard"]):
        rag_hits = document_rag_service.search_context(query=state["user_query"], dataset_id=dataset_id)
        state["rag_sources"] = rag_hits

    state["tool_calls"] = tool_calls
    return state


def tool_execution_node(state: AgentState) -> AgentState:
    """Executes only approved deterministic Python tools with validated arguments."""
    results: List[Dict[str, Any]] = []
    chart_spec = None

    for call in state.get("tool_calls", []):
        tool_name = call.get("tool")
        args = call.get("args", {})

        if tool_name not in APPROVED_TOOLS:
            logger.warning(f"Rejected unapproved tool call: {tool_name}")
            continue

        tool_meta = APPROVED_TOOLS[tool_name]
        try:
            # Validate through Pydantic schema
            validated_args = tool_meta["schema"](**args)
            output = tool_meta["function"](validated_args)
            results.append({
                "tool": tool_name,
                "status": "success",
                "output": output,
            })

            # Automatically generate chart specification if data is suitable
            if tool_name == "aggregate_metric" and output.get("results"):
                records = output["results"]
                group_col = output["group_by"][0]
                value_col = output["value_column"]
                chart_type = "pie" if len(records) <= 5 and output.get("agg_func") == "sum" else "bar"
                chart_spec = data_service.generate_chart_spec(
                    chart_type=chart_type,
                    title=f"{value_col.replace('_', ' ').title()} by {group_col.title()}",
                    x_col=group_col,
                    y_col=value_col,
                    data=records,
                    series_name=value_col.replace("_", " ").title(),
                )

            elif tool_name == "time_series_trend" and output.get("trend"):
                chart_spec = data_service.generate_chart_spec(
                    chart_type="line",
                    title=f"Monthly {output['metric_col'].title()} Trend",
                    x_col="period",
                    y_col=output["metric_col"],
                    data=output["trend"],
                    series_name=output["metric_col"].title(),
                )

        except Exception as e:
            logger.error(f"Error executing tool {tool_name}: {e}")
            results.append({
                "tool": tool_name,
                "status": "error",
                "error": str(e),
            })

    state["tool_results"] = results
    state["chart_spec"] = chart_spec
    return state


def synthesizer_node(state: AgentState) -> AgentState:
    """
    Synthesizes executive insights.
    All numerical claims are strictly derived from tool_results.
    """
    llm = initialize_llm()
    tool_results = state.get("tool_results", [])
    query = state["user_query"]
    rag_sources = state.get("rag_sources", [])

    # If LLM is available, use prompt with strict guardrail
    if llm:
        system_prompt = (
            "You are DataPilot AI, a Senior Data Analyst Assistant.\n"
            "STRICT GUARDRAILS:\n"
            "1. ONLY state facts and numbers that appear verbatim in the Tool Results below.\n"
            "2. NEVER invent, extrapolate, or hallucinate numerical values.\n"
            "3. State key findings clearly with bullet points.\n"
            "4. If reference document citations exist, cite the page number.\n"
            "5. Explicitly state the calculation method or any assumptions.\n"
        )
        context = {
            "user_query": query,
            "tool_results": tool_results,
            "reference_document_sources": rag_sources,
        }
        try:
            from langchain_core.messages import HumanMessage, SystemMessage
            response = llm.invoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=f"Context and Tool Results:\n{json.dumps(context, indent=2)}\n\nPlease synthesize the answer."),
            ])
            state["final_response"] = response.content
            return state
        except Exception as e:
            logger.error(f"LLM synthesis failed, falling back to deterministic synthesis: {e}")

    # Deterministic synthesis fallback (Guaranteed 100% accurate, zero hallucinations)
    parts = []
    for res in tool_results:
        tool = res.get("tool")
        out = res.get("output", {})

        if tool == "aggregate_metric":
            summary = out.get("summary", {})
            metric = out.get("metric")
            group = out.get("group_by", [""])[0]
            val_col = out.get("value_column")
            highest = summary.get("highest_group")
            lowest = summary.get("lowest_group")
            total = summary.get("overall_sum")

            parts.append(f"### Analysis: {metric.title()} by {group.title()}\n")
            if total is not None:
                parts.append(f"- **Total {metric.title()}**: **${total:,.2f}** across {summary.get('total_groups')} {group}s.")
            if highest:
                parts.append(f"- **Top Performer**: **{highest.get(group)}** with **${highest.get(val_col):,.2f}**.")
            if lowest and summary.get("total_groups", 0) > 1:
                parts.append(f"- **Lowest Performer**: **{lowest.get(group)}** with **${lowest.get(val_col):,.2f}**.")
            parts.append(f"\n*Calculation note: Computed deterministically using Pandas `{out.get('agg_func')}` aggregation.*")

        elif tool == "time_series_trend":
            trend = out.get("trend", [])
            metric = out.get("metric_col")
            parts.append(f"### Time Series Trend: {metric.title()}\n")
            for item in trend:
                chg = item.get("pct_change", 0)
                sign = "+" if chg > 0 else ""
                parts.append(f"- **{item.get('period')}**: **${item.get(metric):,.2f}** ({sign}{chg}% vs prior)")
            parts.append(f"\n*Calculation note: Grouped chronologically by {out.get('frequency')} frequency.*")

        elif tool == "compare_groups":
            results = out.get("results", [])
            group = out.get("group_column")
            parts.append(f"### Comparative Group Analysis ({group.title()})\n")
            for r in results:
                items_str = ", ".join([f"{k.replace('_', ' ')}: {v}" for k, v in r.items() if k != group])
                parts.append(f"- **{r.get(group)}**: {items_str}")

        elif tool == "profile_data":
            parts.append("### Dataset Health & Profile Summary\n")
            parts.append(f"- **Dimensions**: {out.get('rows')} rows × {out.get('columns')} columns ({out.get('memory_mb')} MB)")
            parts.append(f"- **Duplicates**: {out.get('duplicate_rows')} rows ({out.get('duplicate_pct')}%)")
            missing = out.get("missing_values_report", [])
            if missing:
                missing_str = ", ".join([f"{m['column']} ({m['missing_count']} nulls)" for m in missing])
                parts.append(f"- **Missing Values Detected**: {missing_str}")
            else:
                parts.append("- **Missing Values**: 0 missing values across all columns (100% clean).")

    if rag_sources:
        parts.append("\n### Reference Documentation Citations")
        for src in rag_sources:
            parts.append(f"- **{src.get('filename')}** (Page {src.get('page_number')}): {src.get('snippet')}")

    state["final_response"] = "\n".join(parts) if parts else "No matching data analysis tool could be executed for this query."
    return state


def build_agent_graph():
    """Compiles the controlled LangGraph workflow."""
    workflow = StateGraph(AgentState)

    workflow.add_node("router", router_node)
    workflow.add_node("executor", tool_execution_node)
    workflow.add_node("synthesizer", synthesizer_node)

    workflow.set_entry_point("router")
    workflow.add_edge("router", "executor")
    workflow.add_edge("executor", "synthesizer")
    workflow.add_edge("synthesizer", END)

    return workflow.compile()


agent_graph = build_agent_graph()
