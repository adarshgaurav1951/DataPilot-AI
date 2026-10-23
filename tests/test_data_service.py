import os
import pytest
from backend.db.database import init_db
from backend.services.data_service import data_service


@pytest.fixture(autouse=True)
def setup_database():
    init_db()


def test_load_and_profile_sample_sales_csv():
    csv_path = "data/sample_sales.csv"
    assert os.path.exists(csv_path), "sample_sales.csv must exist"

    with open(csv_path, "rb") as f:
        content = f.read()

    dataset_id, profile = data_service.load_and_profile_file(content, "sample_sales.csv")

    assert dataset_id is not None
    assert profile["rows"] == 20
    assert profile["columns"] == 10
    assert "region" in [c["name"] for c in profile["columns_meta"]]
    assert "revenue" in profile["numeric_columns"]
    assert "order_date" in profile["datetime_columns"]
    assert len(profile["preview"]) == 15


def test_deterministic_aggregate_metric():
    csv_path = "data/sample_sales.csv"
    with open(csv_path, "rb") as f:
        content = f.read()

    dataset_id, _ = data_service.load_and_profile_file(content, "sample_sales.csv")

    # Aggregate total revenue by region
    result = data_service.aggregate_metric(
        dataset_id=dataset_id,
        metric_col="revenue",
        group_by_cols=["region"],
        agg_func="sum",
        sort_desc=True,
    )

    assert result["metric"] == "revenue"
    assert result["total_rows_used"] == 20
    assert len(result["results"]) == 4

    # North should be the highest revenue region based on sample_sales
    highest = result["results"][0]
    assert highest["region"] == "North"
    assert highest["revenue"] == 1915.07

    # Validate deterministic summary
    assert result["summary"]["highest_group"]["region"] == "North"
    assert result["summary"]["total_groups"] == 4


def test_aggregate_with_filter():
    csv_path = "data/sample_sales.csv"
    with open(csv_path, "rb") as f:
        content = f.read()

    dataset_id, _ = data_service.load_and_profile_file(content, "sample_sales.csv")

    result = data_service.aggregate_metric(
        dataset_id=dataset_id,
        metric_col="profit",
        group_by_cols=["category"],
        agg_func="sum",
        filters={"sales_channel": "Online"},
    )

    assert result["total_rows_used"] > 0
    categories = [r["category"] for r in result["results"]]
    assert "Electronics" in categories


def test_compare_groups():
    csv_path = "data/sample_sales.csv"
    with open(csv_path, "rb") as f:
        content = f.read()

    dataset_id, _ = data_service.load_and_profile_file(content, "sample_sales.csv")

    comp = data_service.compare_groups(
        dataset_id=dataset_id,
        group_col="category",
        metric_cols=["revenue", "profit"],
        agg_funcs=["sum", "mean"],
    )

    assert comp["group_column"] == "category"
    assert len(comp["results"]) == 3  # Electronics, Home, Office
    first_res = comp["results"][0]
    assert "revenue_sum" in first_res
    assert "profit_sum" in first_res


def test_time_series_trend():
    csv_path = "data/sample_sales.csv"
    with open(csv_path, "rb") as f:
        content = f.read()

    dataset_id, _ = data_service.load_and_profile_file(content, "sample_sales.csv")

    trend = data_service.time_series_trend(
        dataset_id=dataset_id,
        date_col="order_date",
        metric_col="revenue",
        freq="M",
    )

    assert trend["metric_col"] == "revenue"
    assert len(trend["trend"]) >= 2  # spans Jan, Feb, Mar 2026
    assert "period" in trend["trend"][0]
    assert "pct_change" in trend["trend"][0]


def test_safe_cleaning_operations():
    # Construct a test CSV with duplicates and missing values
    raw_csv = (
        "id,item,price\n"
        "1,Widget,10.0\n"
        "2,Gadget,\n"
        "1,Widget,10.0\n"
        "3,Gizmo,30.0\n"
    ).encode("utf-8")

    dataset_id, profile_before = data_service.load_and_profile_file(raw_csv, "test_clean.csv")
    assert profile_before["rows"] == 4
    assert profile_before["duplicate_rows"] == 1

    clean_res = data_service.clean_dataset(
        dataset_id,
        operations=[
            {"op": "drop_duplicates"},
            {"op": "impute", "column": "price", "strategy": "mean"},
        ],
    )

    assert clean_res["rows_after"] == 3
    assert clean_res["updated_profile"]["duplicate_rows"] == 0
    # Missing value imputed
    price_missing = [
        c for c in clean_res["updated_profile"]["columns_meta"] if c["name"] == "price"
    ][0]["null_count"]
    assert price_missing == 0
