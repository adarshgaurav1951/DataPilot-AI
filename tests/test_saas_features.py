import os
import pytest
from fastapi.testclient import TestClient
from app import app
from backend.db.database import init_db
from backend.services.data_service import data_service
from backend.services.report_service import report_service

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_test_db():
    init_db()


def test_excel_sheet_inspection_and_loading():
    xlsx_path = "data/sample_sales.xlsx"
    assert os.path.exists(xlsx_path), "sample_sales.xlsx must exist"

    with open(xlsx_path, "rb") as f:
        content = f.read()

    sheets = data_service.inspect_excel_sheets(content)
    assert len(sheets) > 0

    dataset_id, profile = data_service.load_and_profile_file(
        content,
        "sample_sales.xlsx",
        sheet_name=sheets[0],
    )
    assert profile["rows"] == 20
    assert profile["selected_sheet"] == sheets[0]
    assert profile["available_sheets"] == sheets


def test_outlier_detection_iqr_and_zscore():
    with open("data/sample_sales.csv", "rb") as f:
        content = f.read()

    dataset_id, profile = data_service.load_and_profile_file(content, "sample_sales.csv")
    outliers = profile.get("outliers_report", {})

    assert "revenue" in outliers
    assert outliers["revenue"]["method"] == "iqr (1.5 * IQR rule)"
    assert "lower_bound" in outliers["revenue"]
    assert "upper_bound" in outliers["revenue"]


def test_executive_report_generation():
    with open("data/sample_sales.csv", "rb") as f:
        content = f.read()

    dataset_id, _ = data_service.load_and_profile_file(content, "sample_sales.csv")

    report_data = report_service.generate_report_data(dataset_id, "Sample Sales Executive Audit")
    assert report_data["total_rows"] == 20
    assert report_data["health_score"] > 80
    assert len(report_data["recommended_questions"]) > 0

    # Verify Markdown rendering
    md = report_service.render_markdown_report(report_data)
    assert "# Sample Sales Executive Audit" in md
    assert "Health Score" in md

    # Verify HTML rendering
    html = report_service.render_html_report(report_data)
    assert "<!DOCTYPE html>" in html
    assert "Executive Summary" in html


def test_auth_registration_login_and_me():
    email = f"test_{os.urandom(4).hex()}@datapilot.ai"
    password = "StrongPassword123!"

    # 1. Register
    reg_res = client.post(
        "/api/auth/register",
        json={"email": email, "password": password, "full_name": "Test Analyst"},
    )
    assert reg_res.status_code == 200
    token = reg_res.json()["access_token"]
    assert token is not None

    # 2. Get profile /me
    headers = {"Authorization": f"Bearer {token}"}
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    profile = me_res.json()
    assert profile["email"] == email
    assert profile["plan_tier"] == "free"
    assert "limits" in profile
    assert profile["limits"]["max_queries_month"] == 25

    # 3. Login
    login_res = client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # 4. Upgrade plan
    upg_res = client.post(
        "/api/auth/upgrade",
        headers=headers,
        json={"plan_tier": "starter"},
    )
    assert upg_res.status_code == 200
    assert upg_res.json()["new_tier"] == "starter"


def test_api_report_endpoints():
    sample_res = client.post("/api/load-sample?file_type=csv")
    dataset_id = sample_res.json()["dataset_id"]

    # Generate Report API
    rep_res = client.post(f"/api/datasets/{dataset_id}/report")
    assert rep_res.status_code == 200
    data = rep_res.json()
    assert data["status"] == "success"
    assert "report" in data
    assert "markdown" in data

    # Download Report API (HTML)
    dl_res = client.get(f"/api/datasets/{dataset_id}/report/download?format=html")
    assert dl_res.status_code == 200
    assert "<!DOCTYPE html>" in dl_res.text
