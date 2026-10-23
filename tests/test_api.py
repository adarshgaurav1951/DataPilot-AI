import os
import pytest
from fastapi.testclient import TestClient
from app import app
from backend.db.database import init_db

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_test_db():
    init_db()


def test_health_check_endpoint():
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["app"] == "DataPilot AI"
    assert "limits" in data


def test_load_sample_endpoint():
    res = client.post("/api/load-sample?file_type=csv")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["profile"]["rows"] == 20
    assert "dataset_id" in data


def test_upload_csv_endpoint():
    csv_bytes = b"order_id,product,amount\n101,Laptop,1200\n102,Phone,800\n"
    res = client.post(
        "/api/upload",
        files={"file": ("test_orders.csv", csv_bytes, "text/csv")},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["profile"]["rows"] == 2
    assert "dataset_id" in data


def test_clean_endpoint():
    sample_res = client.post("/api/load-sample?file_type=csv")
    dataset_id = sample_res.json()["dataset_id"]

    clean_res = client.post(
        f"/api/datasets/{dataset_id}/clean",
        json={
            "operations": [
                {"op": "drop_duplicates"},
            ]
        },
    )
    assert clean_res.status_code == 200
    assert "updated_profile" in clean_res.json()


def test_direct_analyze_endpoint():
    sample_res = client.post("/api/load-sample?file_type=csv")
    dataset_id = sample_res.json()["dataset_id"]

    analyze_res = client.post(
        f"/api/datasets/{dataset_id}/analyze",
        json={
            "tool": "aggregate",
            "metric_col": "revenue",
            "group_by_cols": ["region"],
            "agg_func": "sum",
        },
    )
    assert analyze_res.status_code == 200
    data = analyze_res.json()
    assert "analysis" in data
    assert "chart_spec" in data
    assert data["analysis"]["metric"] == "revenue"


def test_chat_with_agent_endpoint():
    sample_res = client.post("/api/load-sample?file_type=csv")
    dataset_id = sample_res.json()["dataset_id"]

    chat_res = client.post(
        "/api/chat",
        json={
            "dataset_id": dataset_id,
            "message": "Which region generated the most revenue?",
        },
    )
    assert chat_res.status_code == 200
    data = chat_res.json()
    assert "conversation_id" in data
    assert "reply" in data
    assert "North" in data["reply"]
    assert data["intent"] == "aggregation"
    assert data["chart_spec"] is not None

    # Verify conversation history persistence
    hist_res = client.get(f"/api/conversations/{dataset_id}")
    assert hist_res.status_code == 200
    conversations = hist_res.json()
    assert len(conversations) > 0
    assert len(conversations[0]["messages"]) >= 2  # user and assistant
