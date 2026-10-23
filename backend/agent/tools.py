from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from backend.services.data_service import data_service


class ProfileDataInput(BaseModel):
    dataset_id: str = Field(description="The unique identifier of the dataset to profile.")


class AggregateMetricInput(BaseModel):
    dataset_id: str = Field(description="The unique identifier of the dataset.")
    metric_col: str = Field(description="The numeric column to aggregate, e.g. 'revenue', 'profit', 'quantity'.")
    group_by_cols: List[str] = Field(description="The categorical or group column(s), e.g. ['region'] or ['category'].")
    agg_func: str = Field(default="sum", description="Aggregation function: 'sum', 'mean', 'count', 'min', 'max', 'median'.")
    sort_desc: bool = Field(default=True, description="Whether to sort descending.")
    top_n: Optional[int] = Field(default=10, description="Max number of top groups to return.")
    filters: Optional[Dict[str, Any]] = Field(default=None, description="Optional key-value filters, e.g. {'sales_channel': 'Online'}.")


class CompareGroupsInput(BaseModel):
    dataset_id: str = Field(description="The unique identifier of the dataset.")
    group_col: str = Field(description="The grouping column, e.g. 'category' or 'region'.")
    metric_cols: List[str] = Field(description="List of numeric metrics to compare, e.g. ['revenue', 'profit'].")
    agg_funcs: Optional[List[str]] = Field(default=["sum", "mean"], description="Functions to apply, e.g. ['sum', 'mean'].")


class TimeSeriesTrendInput(BaseModel):
    dataset_id: str = Field(description="The unique identifier of the dataset.")
    date_col: str = Field(description="The datetime column, e.g. 'order_date'.")
    metric_col: str = Field(description="The metric column to track over time, e.g. 'revenue'.")
    freq: str = Field(default="M", description="Frequency: 'D' (daily), 'W' (weekly), 'M' (monthly), 'Q' (quarterly).")
    agg_func: str = Field(default="sum", description="Aggregation function: 'sum', 'mean', 'count'.")


class GenerateChartInput(BaseModel):
    chart_type: str = Field(description="Type of chart: 'bar', 'line', 'pie', 'area', or 'scatter'.")
    title: str = Field(description="Title for the chart.")
    x_col: str = Field(description="Field name for the x-axis / categories.")
    y_col: str = Field(description="Field name for the y-axis / values.")
    data: List[Dict[str, Any]] = Field(description="Data records to plot, usually from aggregate_metric results.")
    series_name: Optional[str] = Field(default=None, description="Display label for the data series.")


def tool_profile_data(args: ProfileDataInput) -> Dict[str, Any]:
    df = data_service.get_dataframe(args.dataset_id)
    return data_service.profile_dataframe(df)


def tool_aggregate_metric(args: AggregateMetricInput) -> Dict[str, Any]:
    return data_service.aggregate_metric(
        dataset_id=args.dataset_id,
        metric_col=args.metric_col,
        group_by_cols=args.group_by_cols,
        agg_func=args.agg_func,
        sort_desc=args.sort_desc,
        top_n=args.top_n,
        filters=args.filters,
    )


def tool_compare_groups(args: CompareGroupsInput) -> Dict[str, Any]:
    return data_service.compare_groups(
        dataset_id=args.dataset_id,
        group_col=args.group_col,
        metric_cols=args.metric_cols,
        agg_funcs=args.agg_funcs,
    )


def tool_time_series_trend(args: TimeSeriesTrendInput) -> Dict[str, Any]:
    return data_service.time_series_trend(
        dataset_id=args.dataset_id,
        date_col=args.date_col,
        metric_col=args.metric_col,
        freq=args.freq,
        agg_func=args.agg_func,
    )


def tool_generate_chart(args: GenerateChartInput) -> Dict[str, Any]:
    return data_service.generate_chart_spec(
        chart_type=args.chart_type,
        title=args.title,
        x_col=args.x_col,
        y_col=args.y_col,
        data=args.data,
        series_name=args.series_name,
    )


# Registry of approved tools
APPROVED_TOOLS = {
    "profile_data": {
        "function": tool_profile_data,
        "schema": ProfileDataInput,
        "description": "Inspects dataset dimensions, column names, inferred data types, missing values, and duplicate row count.",
    },
    "aggregate_metric": {
        "function": tool_aggregate_metric,
        "schema": AggregateMetricInput,
        "description": "Calculates exact deterministic sums, averages, counts, min, max or medians grouped by categories (e.g. revenue by region).",
    },
    "compare_groups": {
        "function": tool_compare_groups,
        "schema": CompareGroupsInput,
        "description": "Compares multiple numeric metrics across categorical groups (e.g. revenue and profit by product category).",
    },
    "time_series_trend": {
        "function": tool_time_series_trend,
        "schema": TimeSeriesTrendInput,
        "description": "Calculates chronological trends (monthly, weekly, daily) and percentage changes over time.",
    },
    "generate_chart": {
        "function": tool_generate_chart,
        "schema": GenerateChartInput,
        "description": "Produces an interactive chart specification (bar, line, pie, area) based on computed data results.",
    },
}
