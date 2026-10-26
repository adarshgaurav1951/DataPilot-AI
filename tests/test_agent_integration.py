import io
import json
import os
import pytest
from fastapi.testclient import TestClient

from app import app
from backend.core.auth import create_access_token, hash_password
from backend.db.database import get_db, init_db
from backend.db.models import ConversationModel, DatasetModel, MessageModel, UserModel, UsageModel
from backend.rag.document_service import document_rag_service

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_test_db():
    init_db()


def create_test_user(db, email="analyst_test@datapilot.ai", tier="free"):
    user = db.query(UserModel).filter(UserModel.email == email).first()
    if not user:
        user = UserModel(
            email=email,
            hashed_password=hash_password("Secr3tPassword!"),
            full_name="Analyst Tester",
            plan_tier=tier,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


# =====================================================================
# 1. MULTI-TURN CONVERSATION + DATABASE PERSISTENCE INTEGRATION
# =====================================================================

def test_multi_turn_conversation_chat_integration():
    """Tests multi-turn agent conversation with persistent message history in SQLite."""
    # 1. Load sample dataset
    sample_res = client.post("/api/load-sample?file_type=csv")
    assert sample_res.status_code == 200
    dataset_id = sample_res.json()["dataset_id"]

    # 2. Turn 1: Revenue by region
    res1 = client.post(
        "/api/chat",
        json={
            "dataset_id": dataset_id,
            "message": "Which region generated the most revenue?",
        },
    )
    assert res1.status_code == 200
    data1 = res1.json()
    conv_id = data1["conversation_id"]
    assert conv_id is not None
    assert "North" in data1["reply"]
    assert data1["intent"] == "aggregation"
    assert data1["chart_spec"] is not None

    # 3. Turn 2: Follow-up question in the same conversation
    res2 = client.post(
        "/api/chat",
        json={
            "dataset_id": dataset_id,
            "conversation_id": conv_id,
            "message": "Show monthly revenue trend over time",
        },
    )
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["conversation_id"] == conv_id
    assert data2["intent"] == "time_series"
    assert data2["chart_spec"]["chart_type"] == "line"

    # 4. Verify conversation history in database
    db = next(get_db())
    conv = db.query(ConversationModel).filter(ConversationModel.id == conv_id).first()
    assert conv is not None
    assert conv.dataset_id == dataset_id

    messages = db.query(MessageModel).filter(MessageModel.conversation_id == conv_id).order_by(MessageModel.created_at).all()
    assert len(messages) == 4  # (User 1, Assistant 1, User 2, Assistant 2)
    assert messages[0].role == "user"
    assert "Which region" in messages[0].content
    assert messages[1].role == "assistant"
    assert "North" in messages[1].content
    assert messages[2].role == "user"
    assert "monthly" in messages[2].content
    assert messages[3].role == "assistant"
    assert "Time Series Trend" in messages[3].content


# =====================================================================
# 2. DATASET CLEANING & AGENT RE-EVALUATION INTEGRATION
# =====================================================================

def test_agent_workflow_after_cleaning_dataset():
    """Tests agent data health analysis before and after applying data cleaning operations."""
    # 1. Upload a CSV containing duplicates
    dirty_csv = (
        b"order_id,product,amount\n"
        b"101,Laptop,1200\n"
        b"101,Laptop,1200\n"  # Duplicate row
        b"102,Phone,800\n"
    )
    upload_res = client.post(
        "/api/upload",
        files={"file": ("dirty_sales.csv", dirty_csv, "text/csv")},
    )
    assert upload_res.status_code == 200
    dataset_id = upload_res.json()["dataset_id"]

    # 2. Ask agent to audit data health before cleaning
    audit_res1 = client.post(
        "/api/chat",
        json={
            "dataset_id": dataset_id,
            "message": "Check data health and duplicate rows",
        },
    )
    assert audit_res1.status_code == 200
    assert "1 rows" in audit_res1.json()["reply"] or "Duplicates**: 1" in audit_res1.json()["reply"]

    # 3. Clean dataset by dropping duplicate rows
    clean_res = client.post(
        f"/api/datasets/{dataset_id}/clean",
        json={
            "operations": [
                {"op": "drop_duplicates"},
            ]
        },
    )
    assert clean_res.status_code == 200
    clean_profile = clean_res.json()["updated_profile"]
    assert clean_profile["rows"] == 2
    assert clean_profile["duplicate_rows"] == 0

    # 4. Ask agent again after cleaning: should now report 0 duplicates
    audit_res2 = client.post(
        "/api/chat",
        json={
            "dataset_id": dataset_id,
            "message": "Check duplicate rows now",
        },
    )
    assert audit_res2.status_code == 200
    assert "0 rows (0.0%)" in audit_res2.json()["reply"] or "0 duplicates" in audit_res2.json()["reply"]


# =====================================================================
# 3. RAG DOCUMENT INGESTION & AGENT CITATIONS INTEGRATION
# =====================================================================

def test_agent_rag_reference_document_search_integration():
    """Tests RAG index integration and citation generation when agent receives policy queries."""
    sample_res = client.post("/api/load-sample?file_type=csv")
    dataset_id = sample_res.json()["dataset_id"]

    # Ingest synthetic knowledge chunk into document_rag_service
    document_rag_service.documents_index = [
        {
            "doc_id": "doc_test_kpi",
            "dataset_id": dataset_id,
            "filename": "Enterprise_KPI_Manual.pdf",
            "pages": [
                {
                    "page_number": 3,
                    "text": "Regional revenue KPI calculates gross recognized sales minus promotional discounts.",
                }
            ],
        }
    ]

    # Query agent with standard KPI policy keyword
    chat_res = client.post(
        "/api/chat",
        json={
            "dataset_id": dataset_id,
            "message": "What is the standard policy definition and rule for revenue KPI?",
        },
    )
    assert chat_res.status_code == 200
    data = chat_res.json()

    # Verify RAG search returned citations
    assert len(data["rag_sources"]) > 0
    assert data["rag_sources"][0]["filename"] == "Enterprise_KPI_Manual.pdf"
    assert "Enterprise_KPI_Manual.pdf" in data["reply"]
    assert "Page 3" in data["reply"]
    assert "promotional discounts" in data["reply"]


# =====================================================================
# 4. USER QUOTA LIMIT ENFORCEMENT INTEGRATION
# =====================================================================

def test_agent_chat_quota_enforcement_integration():
    """Tests that authenticated users exceeding their plan tier quota are blocked with HTTP 402."""
    db = next(get_db())
    user = create_test_user(db, email="quota_exceeded@datapilot.ai", tier="free")
    token = create_access_token(data={"sub": user.id, "email": user.email, "tier": user.plan_tier})

    sample_res = client.post("/api/load-sample?file_type=csv")
    dataset_id = sample_res.json()["dataset_id"]

    # Associate dataset with user
    ds = db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
    ds.user_id = user.id
    db.commit()

    # Exhaust the user's free monthly limit (free tier limit is 25 queries)
    usage = db.query(UsageModel).filter(UsageModel.user_id == user.id).first()
    if not usage:
        usage = UsageModel(user_id=user.id, analyses_count=25)
        db.add(usage)
    else:
        usage.analyses_count = 25
    db.commit()

    # Attempt to chat with agent
    resp = client.post(
        "/api/chat",
        json={
            "dataset_id": dataset_id,
            "message": "Give me revenue by region",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 402
    assert "Monthly analysis quota reached" in resp.json()["detail"]


# =====================================================================
# 5. EXCEL MULTI-SHEET AGENT QUERY INTEGRATION
# =====================================================================

def test_agent_excel_multi_sheet_integration():
    """Tests agent execution when queried against an Excel workbook dataset."""
    xlsx_path = "data/sample_sales.xlsx"
    assert os.path.exists(xlsx_path), "sample_sales.xlsx must exist"

    with open(xlsx_path, "rb") as f:
        content = f.read()

    upload_res = client.post(
        "/api/upload",
        files={"file": ("sample_sales.xlsx", content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
    )
    assert upload_res.status_code == 200
    dataset_id = upload_res.json()["dataset_id"]

    chat_res = client.post(
        "/api/chat",
        json={
            "dataset_id": dataset_id,
            "message": "Which region had the highest revenue?",
        },
    )
    assert chat_res.status_code == 200
    data = chat_res.json()
    assert "North" in data["reply"]
    assert data["intent"] == "aggregation"
    assert data["chart_spec"] is not None
