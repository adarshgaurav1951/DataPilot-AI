from io import BytesIO
import json
import os
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, Response, UploadFile, status
from pydantic import BaseModel, Field
from backend.agent.workflow import agent_graph
from backend.core.auth import get_current_user_optional
from backend.core.config import get_settings
from backend.core.logging import logger
from backend.db.database import get_db
from backend.db.models import ConversationModel, DatasetModel, MessageModel, UserModel, generate_uuid
from backend.rag.document_service import document_rag_service
from backend.services.data_service import data_service
from backend.services.quota_service import quota_service
from backend.services.rate_limiter import check_rate_limit
from backend.services.report_service import report_service

settings = get_settings()
router = APIRouter(prefix="/api", dependencies=[Depends(check_rate_limit)])


# ==========================================
# PYDANTIC SCHEMAS
# ==========================================

class CleanRequest(BaseModel):
    operations: List[Dict[str, Any]] = Field(description="List of cleaning operations (drop_duplicates, impute, convert_type).")


class SelectSheetRequest(BaseModel):
    sheet_name: str = Field(description="Name of the worksheet to load and analyze.")


class AnalyzeRequest(BaseModel):
    tool: str = Field(description="Tool to run: 'aggregate', 'compare', 'trend'.")
    metric_col: Optional[str] = None
    group_by_cols: Optional[List[str]] = None
    agg_func: Optional[str] = "sum"
    date_col: Optional[str] = None
    freq: Optional[str] = "M"
    filters: Optional[Dict[str, Any]] = None


class ChatRequest(BaseModel):
    dataset_id: str
    message: str
    conversation_id: Optional[str] = None


class RAGQueryRequest(BaseModel):
    query: str
    dataset_id: Optional[str] = None
    top_k: int = 3


# ==========================================
# DATASET & UPLOAD ROUTES
# ==========================================

@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    sheet_name: Optional[str] = Form(None),
    user: Optional[UserModel] = Depends(get_current_user_optional),
    db=Depends(get_db),
):
    """Uploads and profiles a CSV or XLSX dataset with user isolation and quota enforcement."""
    filename = file.filename or "uploaded_data.csv"
    content = await file.read()

    # Quota check
    user_id = user.id if user else None
    existing_count = db.query(DatasetModel).filter(DatasetModel.user_id == user_id).count() if user_id else 0
    quota_service.check_upload_quota(user, len(content), existing_count)

    dataset_id, profile = data_service.load_and_profile_file(
        content=content,
        filename=filename,
        sheet_name=sheet_name,
        user_id=user_id,
    )

    if user:
        usage = quota_service.get_or_create_usage(user, db)
        usage.datasets_count += 1
        db.commit()

    return {
        "status": "success",
        "dataset_id": dataset_id,
        "filename": filename,
        "selected_sheet": profile.get("selected_sheet"),
        "available_sheets": profile.get("available_sheets", []),
        "profile": profile,
    }


@router.post("/load-sample")
def load_sample_dataset(file_type: str = "csv", user: Optional[UserModel] = Depends(get_current_user_optional)):
    """Preloads the bundled sample sales dataset for quick evaluation."""
    target_file = "data/sample_sales.csv" if file_type.lower() == "csv" else "data/sample_sales.xlsx"
    if not os.path.exists(target_file):
        raise HTTPException(status_code=404, detail="Sample sales dataset file not found.")

    with open(target_file, "rb") as f:
        content = f.read()

    filename = os.path.basename(target_file)
    dataset_id, profile = data_service.load_and_profile_file(
        content=content,
        filename=filename,
        user_id=user.id if user else None,
    )

    return {
        "status": "success",
        "dataset_id": dataset_id,
        "filename": filename,
        "profile": profile,
    }


@router.get("/datasets")
def list_user_datasets(user: Optional[UserModel] = Depends(get_current_user_optional), db=Depends(get_db)):
    """Lists datasets belonging to the current user (or demo datasets for guests)."""
    user_id = user.id if user else None
    datasets = db.query(DatasetModel).filter(DatasetModel.user_id == user_id).order_by(DatasetModel.created_at.desc()).all()
    return [
        {
            "id": d.id,
            "filename": d.filename,
            "row_count": d.row_count,
            "col_count": d.col_count,
            "created_at": d.created_at.isoformat() if d.created_at else None,
        }
        for d in datasets
    ]


@router.get("/datasets/{dataset_id}")
def get_dataset_profile(
    dataset_id: str,
    user: Optional[UserModel] = Depends(get_current_user_optional),
    db=Depends(get_db),
):
    """Fetches profile, metadata, and audit log for a specific dataset."""
    query = db.query(DatasetModel).filter(DatasetModel.id == dataset_id)
    if user:
        query = query.filter((DatasetModel.user_id == user.id) | (DatasetModel.user_id == None))
    ds = query.first()

    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found or access denied.")

    profile = json.loads(ds.profile_json) if ds.profile_json else {}
    audit_trail = json.loads(ds.transformation_log_json) if ds.transformation_log_json else []

    return {
        "dataset_id": ds.id,
        "filename": ds.filename,
        "selected_sheet": ds.selected_sheet,
        "available_sheets": json.loads(ds.available_sheets_json) if ds.available_sheets_json else [],
        "created_at": ds.created_at.isoformat() if ds.created_at else None,
        "audit_trail": audit_trail,
        "profile": profile,
    }


@router.post("/datasets/{dataset_id}/select-sheet")
def select_dataset_sheet(
    dataset_id: str,
    req: SelectSheetRequest,
    user: Optional[UserModel] = Depends(get_current_user_optional),
    db=Depends(get_db),
):
    """Switches active Excel sheet and recomputes profile and metrics."""
    ds = db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
    if not ds or (user and ds.user_id and ds.user_id != user.id):
        raise HTTPException(status_code=404, detail="Dataset not found or access denied.")

    return data_service.select_dataset_sheet(dataset_id=dataset_id, sheet_name=req.sheet_name)


@router.post("/datasets/{dataset_id}/clean")
def clean_dataset(
    dataset_id: str,
    req: CleanRequest,
    user: Optional[UserModel] = Depends(get_current_user_optional),
    db=Depends(get_db),
):
    """Executes safe cleaning transformations on the dataset with immutable audit logging."""
    ds = db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
    if not ds or (user and ds.user_id and ds.user_id != user.id):
        raise HTTPException(status_code=404, detail="Dataset not found or access denied.")

    result = data_service.clean_dataset(dataset_id=dataset_id, operations=req.operations)
    return result


@router.post("/datasets/{dataset_id}/analyze")
def run_direct_analysis(
    dataset_id: str,
    req: AnalyzeRequest,
    user: Optional[UserModel] = Depends(get_current_user_optional),
    db=Depends(get_db),
):
    """Executes deterministic analytical calculations directly."""
    ds = db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
    if not ds or (user and ds.user_id and ds.user_id != user.id):
        raise HTTPException(status_code=404, detail="Dataset not found or access denied.")

    if req.tool == "aggregate":
        if not req.metric_col or not req.group_by_cols:
            raise HTTPException(status_code=422, detail="metric_col and group_by_cols required for aggregation.")
        res = data_service.aggregate_metric(
            dataset_id=dataset_id,
            metric_col=req.metric_col,
            group_by_cols=req.group_by_cols,
            agg_func=req.agg_func or "sum",
            filters=req.filters,
        )
        chart = data_service.generate_chart_spec(
            chart_type="bar",
            title=f"{req.metric_col.title()} by {req.group_by_cols[0].title()}",
            x_col=req.group_by_cols[0],
            y_col=res["value_column"],
            data=res["results"],
        )
        return {"analysis": res, "chart_spec": chart}

    elif req.tool == "trend":
        if not req.date_col or not req.metric_col:
            raise HTTPException(status_code=422, detail="date_col and metric_col required for time series trend.")
        res = data_service.time_series_trend(
            dataset_id=dataset_id,
            date_col=req.date_col,
            metric_col=req.metric_col,
            freq=req.freq or "M",
            agg_func=req.agg_func or "sum",
        )
        chart = data_service.generate_chart_spec(
            chart_type="line",
            title=f"Monthly {req.metric_col.title()} Trend",
            x_col="period",
            y_col=req.metric_col,
            data=res["trend"],
        )
        return {"analysis": res, "chart_spec": chart}

    raise HTTPException(status_code=400, detail=f"Unsupported analysis tool: {req.tool}")


# ==========================================
# AGENT CHAT & CONVERSATION ROUTES
# ==========================================

@router.post("/chat")
def chat_with_agent(
    req: ChatRequest,
    user: Optional[UserModel] = Depends(get_current_user_optional),
    db=Depends(get_db),
):
    """Interacts with the LangGraph Data Analyst Agent with quota enforcement."""
    ds = db.query(DatasetModel).filter(DatasetModel.id == req.dataset_id).first()
    if not ds or (user and ds.user_id and ds.user_id != user.id):
        raise HTTPException(status_code=404, detail="Dataset not found or access denied.")

    # Check analysis quota
    usage = quota_service.get_or_create_usage(user, db) if user else None
    quota_service.check_analysis_quota(user, usage)

    profile = json.loads(ds.profile_json) if ds.profile_json else data_service.profile_dataframe(data_service.get_dataframe(req.dataset_id))

    # Manage conversation session
    conv_id = req.conversation_id or generate_uuid()
    conv = db.query(ConversationModel).filter(ConversationModel.id == conv_id).first()
    if not conv:
        conv = ConversationModel(
            id=conv_id,
            dataset_id=req.dataset_id,
            user_id=user.id if user else None,
            title=req.message[:50],
        )
        db.add(conv)
        db.commit()

    # Save user message
    user_msg = MessageModel(
        conversation_id=conv_id,
        role="user",
        content=req.message,
    )
    db.add(user_msg)
    db.commit()

    # Execute LangGraph workflow
    initial_state = {
        "dataset_id": req.dataset_id,
        "user_query": req.message,
        "dataset_profile": profile,
        "intent": "",
        "tool_calls": [],
        "tool_results": [],
        "chart_spec": None,
        "rag_sources": [],
        "final_response": "",
    }

    agent_result = agent_graph.invoke(initial_state)

    # Save assistant message
    asst_msg = MessageModel(
        conversation_id=conv_id,
        role="assistant",
        content=agent_result["final_response"],
        tool_calls_json=json.dumps(agent_result.get("tool_calls", [])),
        tool_results_json=json.dumps(agent_result.get("tool_results", [])),
        chart_spec_json=json.dumps(agent_result.get("chart_spec")),
    )
    db.add(asst_msg)
    db.commit()

    # Record analysis usage
    quota_service.record_analysis(user, db)

    return {
        "conversation_id": conv_id,
        "reply": agent_result["final_response"],
        "intent": agent_result["intent"],
        "tool_calls": agent_result.get("tool_calls", []),
        "tool_results": agent_result.get("tool_results", []),
        "chart_spec": agent_result.get("chart_spec"),
        "rag_sources": agent_result.get("rag_sources", []),
    }


@router.get("/conversations/{dataset_id}")
def get_conversations(
    dataset_id: str,
    user: Optional[UserModel] = Depends(get_current_user_optional),
    db=Depends(get_db),
):
    """Retrieves conversation history and messages for a dataset."""
    query = db.query(ConversationModel).filter(ConversationModel.dataset_id == dataset_id)
    if user:
        query = query.filter((ConversationModel.user_id == user.id) | (ConversationModel.user_id == None))
    conversations = query.all()

    out = []
    for c in conversations:
        msgs = [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "tool_calls": json.loads(m.tool_calls_json) if m.tool_calls_json else None,
                "tool_results": json.loads(m.tool_results_json) if m.tool_results_json else None,
                "chart_spec": json.loads(m.chart_spec_json) if m.chart_spec_json else None,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            for m in c.messages
        ]
        out.append({
            "conversation_id": c.id,
            "title": c.title,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "messages": msgs,
        })
    return out


# ==========================================
# REPORT GENERATION & EXPORTS
# ==========================================

@router.post("/datasets/{dataset_id}/report")
def generate_dataset_report(
    dataset_id: str,
    title: Optional[str] = None,
    user: Optional[UserModel] = Depends(get_current_user_optional),
    db=Depends(get_db),
):
    """Compiles and generates an executive analytical report."""
    ds = db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
    if not ds or (user and ds.user_id and ds.user_id != user.id):
        raise HTTPException(status_code=404, detail="Dataset not found or access denied.")

    report_data = report_service.generate_report_data(dataset_id=dataset_id, title=title)
    markdown_report = report_service.render_markdown_report(report_data)

    quota_service.record_report(user, db)

    return {
        "status": "success",
        "report": report_data,
        "markdown": markdown_report,
    }


@router.get("/datasets/{dataset_id}/report/download")
def download_dataset_report(
    dataset_id: str,
    format: str = "html",
    user: Optional[UserModel] = Depends(get_current_user_optional),
    db=Depends(get_db),
):
    """Downloads executive report in HTML or Markdown format."""
    ds = db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
    if not ds or (user and ds.user_id and ds.user_id != user.id):
        raise HTTPException(status_code=404, detail="Dataset not found or access denied.")

    report_data = report_service.generate_report_data(dataset_id=dataset_id)

    if format.lower() == "md":
        content = report_service.render_markdown_report(report_data)
        media_type = "text/markdown"
        filename = f"datapilot_report_{dataset_id[:8]}.md"
    else:
        content = report_service.render_html_report(report_data)
        media_type = "text/html"
        filename = f"datapilot_report_{dataset_id[:8]}.html"

    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# ==========================================
# RAG DOCUMENT ROUTES
# ==========================================

@router.post("/rag/upload-doc")
async def upload_rag_document(
    file: UploadFile = File(...),
    dataset_id: Optional[str] = None,
    user: Optional[UserModel] = Depends(get_current_user_optional),
):
    """Uploads and indexes a reference PDF document for semantic retrieval."""
    if not (file.filename or "").lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF reference documents are supported.")

    content = await file.read()
    res = document_rag_service.load_pdf(
        content=content,
        filename=file.filename or "doc.pdf",
        dataset_id=dataset_id,
    )
    return {"status": "success", "document": res}


@router.post("/rag/query")
def query_rag_documents(req: RAGQueryRequest):
    """Searches indexed reference documentation with page citations."""
    hits = document_rag_service.search_context(query=req.query, dataset_id=req.dataset_id, top_k=req.top_k)
    return {"query": req.query, "citations": hits}
