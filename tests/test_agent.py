import os
import pytest
from backend.agent.workflow import agent_graph
from backend.db.database import init_db
from backend.services.data_service import data_service


@pytest.fixture(autouse=True)
def setup_data():
    init_db()
    with open("data/sample_sales.csv", "rb") as f:
        content = f.read()
    dataset_id, profile = data_service.load_and_profile_file(content, "sample_sales.csv")
    return dataset_id, profile


def test_agent_revenue_by_region(setup_data):
    dataset_id, profile = setup_data

    initial_state = {
        "dataset_id": dataset_id,
        "user_query": "Which region generated the most revenue?",
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
    assert len(result["tool_calls"]) > 0
    assert result["tool_calls"][0]["tool"] == "aggregate_metric"

    # Verify tool results
    tool_res = result["tool_results"][0]
    assert tool_res["status"] == "success"
    highest_group = tool_res["output"]["summary"]["highest_group"]
    assert highest_group["region"] == "North"
    assert highest_group["revenue"] == 1915.07

    # Verify chart specification generated
    assert result["chart_spec"] is not None
    assert result["chart_spec"]["x_axis_key"] == "region"

    # Verify final response mentions exact number
    assert "North" in result["final_response"]
    assert "1,915.07" in result["final_response"] or "1915.07" in result["final_response"]


def test_agent_monthly_trend(setup_data):
    dataset_id, profile = setup_data

    initial_state = {
        "dataset_id": dataset_id,
        "user_query": "Show monthly revenue trend over time",
        "dataset_profile": profile,
        "intent": "",
        "tool_calls": [],
        "tool_results": [],
        "chart_spec": None,
        "rag_sources": [],
        "final_response": "",
    }

    result = agent_graph.invoke(initial_state)

    assert result["intent"] == "time_series"
    assert result["tool_results"][0]["status"] == "success"
    assert result["chart_spec"] is not None
    assert result["chart_spec"]["chart_type"] == "line"


def test_agent_data_health_audit(setup_data):
    dataset_id, profile = setup_data

    initial_state = {
        "dataset_id": dataset_id,
        "user_query": "Check data health, missing values and duplicates",
        "dataset_profile": profile,
        "intent": "",
        "tool_calls": [],
        "tool_results": [],
        "chart_spec": None,
        "rag_sources": [],
        "final_response": "",
    }

    result = agent_graph.invoke(initial_state)

    assert result["intent"] == "profile"
    assert "20 rows" in result["final_response"] or "Dimensions" in result["final_response"]
