from datetime import datetime, timezone
from io import BytesIO
import json
import os
import shutil
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
import openpyxl
import pandas as pd
from fastapi import HTTPException
from backend.core.config import get_settings
from backend.core.logging import logger
from backend.db.database import SessionLocal
from backend.db.models import DatasetModel, generate_uuid

settings = get_settings()


class DataService:
    def __init__(self):
        # In-memory cache for fast access: dataset_id -> pd.DataFrame
        self._cache: Dict[str, pd.DataFrame] = {}
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    def get_dataframe(self, dataset_id: str) -> pd.DataFrame:
        """Retrieves DataFrame from memory cache or loads from disk storage."""
        if dataset_id in self._cache:
            return self._cache[dataset_id]

        db = SessionLocal()
        try:
            ds = db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
            if not ds:
                raise HTTPException(status_code=404, detail=f"Dataset '{dataset_id}' not found.")

            file_path = ds.file_path
            if not os.path.exists(file_path):
                raise HTTPException(status_code=404, detail=f"Dataset file missing on disk: {file_path}")

            if file_path.endswith(".csv"):
                df = pd.read_csv(file_path)
            elif file_path.endswith((".xlsx", ".xls")):
                sheet = ds.selected_sheet or 0
                df = pd.read_excel(file_path, sheet_name=sheet, engine="openpyxl")
            else:
                raise HTTPException(status_code=400, detail="Unsupported dataset file format.")

            self._cache[dataset_id] = df
            return df
        finally:
            db.close()

    def set_dataframe(self, dataset_id: str, df: pd.DataFrame, persist_path: Optional[str] = None) -> None:
        """Updates in-memory cache and optionally updates disk copy."""
        self._cache[dataset_id] = df
        if persist_path:
            if persist_path.endswith(".csv"):
                df.to_csv(persist_path, index=False)
            elif persist_path.endswith((".xlsx", ".xls")):
                df.to_excel(persist_path, index=False, engine="openpyxl")

    def inspect_excel_sheets(self, content: bytes) -> List[str]:
        """Returns sheet names for an Excel file without loading the entire data."""
        try:
            wb = openpyxl.load_workbook(BytesIO(content), read_only=True)
            return wb.sheetnames
        except Exception as e:
            logger.warning(f"Could not inspect Excel sheet names: {e}")
            return ["Sheet1"]

    def load_and_profile_file(
        self,
        content: bytes,
        filename: str,
        sheet_name: Optional[str] = None,
        dataset_id: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Validates file upload, creates immutable raw archive, profiles data,
        and registers in database with user ownership.
        """
        # 1. Validate file size
        max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
        if len(content) > max_bytes:
            raise HTTPException(
                status_code=413,
                detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB.",
            )

        fname_lower = filename.lower()
        available_sheets: List[str] = []
        selected_sheet = sheet_name

        # 2. Parse file
        try:
            if fname_lower.endswith(".csv"):
                try:
                    df = pd.read_csv(BytesIO(content))
                except UnicodeDecodeError:
                    df = pd.read_csv(BytesIO(content), encoding="latin-1")
            elif fname_lower.endswith((".xlsx", ".xls")):
                available_sheets = self.inspect_excel_sheets(content)
                target_sheet = sheet_name if sheet_name and sheet_name in available_sheets else (available_sheets[0] if available_sheets else 0)
                selected_sheet = str(target_sheet)
                df = pd.read_excel(BytesIO(content), sheet_name=target_sheet, engine="openpyxl")
            else:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid file type. Only .csv and .xlsx files are accepted.",
                )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error parsing uploaded file: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to read data file: {str(e)}") from e

        # 3. Validate rows and columns
        if df.empty:
            raise HTTPException(status_code=400, detail="The uploaded file contains no data rows.")

        if len(df) > settings.MAX_ROWS:
            raise HTTPException(
                status_code=413,
                detail=f"Dataset exceeds limit: {len(df)} rows (max {settings.MAX_ROWS}).",
            )
        if len(df.columns) > settings.MAX_COLUMNS:
            raise HTTPException(
                status_code=413,
                detail=f"Dataset exceeds limit: {len(df.columns)} columns (max {settings.MAX_COLUMNS}).",
            )

        # Clean column names (strip whitespace, ensure string)
        df.columns = [str(c).strip() for c in df.columns]

        # 4. Deep profiling
        profile = self.profile_dataframe(df)
        profile["available_sheets"] = available_sheets
        profile["selected_sheet"] = selected_sheet

        # 5. Persist raw immutable copy and working copy
        ds_id = dataset_id or generate_uuid()
        ext = os.path.splitext(filename)[1].lower() or ".csv"

        raw_file_path = os.path.join(settings.UPLOAD_DIR, f"raw_{ds_id}{ext}")
        with open(raw_file_path, "wb") as f_raw:
            f_raw.write(content)

        # Working copy is saved as CSV for fast predictable I/O
        working_file_path = os.path.join(settings.UPLOAD_DIR, f"processed_{ds_id}.csv")
        df.to_csv(working_file_path, index=False)

        self._cache[ds_id] = df

        initial_audit_log = [{
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "action": "ingest",
            "details": f"Initial ingestion of '{filename}' ({len(df)} rows, {len(df.columns)} columns).",
            "sheet": selected_sheet,
        }]

        db = SessionLocal()
        try:
            record = db.query(DatasetModel).filter(DatasetModel.id == ds_id).first()
            if not record:
                record = DatasetModel(
                    id=ds_id,
                    user_id=user_id,
                    filename=filename,
                    file_path=working_file_path,
                    raw_file_path=raw_file_path,
                    selected_sheet=selected_sheet,
                    available_sheets_json=json.dumps(available_sheets),
                    transformation_log_json=json.dumps(initial_audit_log),
                    row_count=len(df),
                    col_count=len(df.columns),
                    profile_json=json.dumps(profile),
                )
                db.add(record)
            else:
                record.filename = filename
                record.file_path = working_file_path
                record.selected_sheet = selected_sheet
                record.available_sheets_json = json.dumps(available_sheets)
                record.row_count = len(df)
                record.col_count = len(df.columns)
                record.profile_json = json.dumps(profile)
            db.commit()
        except Exception as e:
            db.rollback()
            logger.error(f"Database error registering dataset: {e}")
        finally:
            db.close()

        return ds_id, profile

    def select_dataset_sheet(self, dataset_id: str, sheet_name: str) -> Dict[str, Any]:
        """Switches the active worksheet for an existing Excel dataset and re-profiles."""
        db = SessionLocal()
        try:
            ds = db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
            if not ds:
                raise HTTPException(status_code=404, detail="Dataset not found.")
            if not ds.raw_file_path or not os.path.exists(ds.raw_file_path):
                raise HTTPException(status_code=400, detail="Original raw workbook file is unavailable.")

            with open(ds.raw_file_path, "rb") as f:
                content = f.read()

            available_sheets = self.inspect_excel_sheets(content)
            if sheet_name not in available_sheets:
                raise HTTPException(
                    status_code=400,
                    detail=f"Sheet '{sheet_name}' not found. Available sheets: {available_sheets}",
                )

            df = pd.read_excel(BytesIO(content), sheet_name=sheet_name, engine="openpyxl")
            profile = self.profile_dataframe(df)
            profile["available_sheets"] = available_sheets
            profile["selected_sheet"] = sheet_name

            working_file_path = os.path.join(settings.UPLOAD_DIR, f"processed_{dataset_id}.csv")
            df.to_csv(working_file_path, index=False)
            self._cache[dataset_id] = df

            audit_log = json.loads(ds.transformation_log_json) if ds.transformation_log_json else []
            audit_log.append({
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "action": "switch_sheet",
                "details": f"Switched active worksheet to '{sheet_name}' ({len(df)} rows, {len(df.columns)} columns).",
                "sheet": sheet_name,
            })

            ds.selected_sheet = sheet_name
            ds.file_path = working_file_path
            ds.row_count = len(df)
            ds.col_count = len(df.columns)
            ds.profile_json = json.dumps(profile)
            ds.transformation_log_json = json.dumps(audit_log)
            db.commit()

            return {
                "dataset_id": dataset_id,
                "selected_sheet": sheet_name,
                "available_sheets": available_sheets,
                "profile": profile,
            }
        finally:
            db.close()

    def detect_outliers(self, df: pd.DataFrame, method: str = "iqr") -> Dict[str, Any]:
        """
        Detects statistical anomalies and outliers in numeric columns.
        Methods:
        - 'iqr': Outliers fall outside [Q1 - 1.5 * IQR, Q3 + 1.5 * IQR]
        - 'z_score': Outliers have absolute standard score |Z| > 3
        """
        numeric_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
        outlier_report: Dict[str, Any] = {}

        for col in numeric_cols:
            series = df[col].dropna()
            if len(series) < 5:
                continue

            if method == "z_score":
                mean = series.mean()
                std = series.std()
                if std > 0:
                    z_scores = ((series - mean) / std).abs()
                    outlier_mask = z_scores > 3
                    outlier_count = int(outlier_mask.sum())
                    sample_vals = series[outlier_mask].head(3).tolist()
                    outlier_report[col] = {
                        "method": "z_score (|z| > 3)",
                        "outlier_count": outlier_count,
                        "outlier_pct": round(outlier_count / len(series) * 100, 2),
                        "mean": round(float(mean), 2),
                        "std": round(float(std), 2),
                        "sample_outliers": [round(float(v), 2) for v in sample_vals],
                    }
            else:
                # Default: IQR
                q25 = series.quantile(0.25)
                q75 = series.quantile(0.75)
                iqr = q75 - q25
                lower_bound = q25 - (1.5 * iqr)
                upper_bound = q75 + (1.5 * iqr)

                outlier_mask = (series < lower_bound) | (series > upper_bound)
                outlier_count = int(outlier_mask.sum())
                sample_vals = series[outlier_mask].head(3).tolist()

                outlier_report[col] = {
                    "method": "iqr (1.5 * IQR rule)",
                    "outlier_count": outlier_count,
                    "outlier_pct": round(outlier_count / len(series) * 100, 2),
                    "lower_bound": round(float(lower_bound), 2),
                    "upper_bound": round(float(upper_bound), 2),
                    "sample_outliers": [round(float(v), 2) for v in sample_vals],
                }

        return outlier_report

    def profile_dataframe(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Deep profiling of DataFrame: schema, missing values, duplicates, summary stats, anomalies."""
        total_rows = int(len(df))
        total_cols = int(len(df.columns))
        duplicate_count = int(df.duplicated().sum())
        duplicate_pct = round((duplicate_count / total_rows * 100), 2) if total_rows > 0 else 0.0

        memory_bytes = int(df.memory_usage(deep=True).sum())
        memory_mb = round(memory_bytes / (1024 * 1024), 2)

        columns_meta: List[Dict[str, Any]] = []
        numeric_cols: List[str] = []
        categorical_cols: List[str] = []
        datetime_cols: List[str] = []
        quality_warnings: List[Dict[str, str]] = []

        for col in df.columns:
            s = df[col]
            null_count = int(s.isna().sum())
            null_pct = round((null_count / total_rows * 100), 2) if total_rows > 0 else 0.0
            unique_count = int(s.nunique(dropna=True))

            # Quality warnings
            if unique_count <= 1 and total_rows > 1:
                quality_warnings.append({
                    "column": col,
                    "type": "constant_column",
                    "message": f"Column '{col}' has only {unique_count} distinct value (zero variance).",
                })
            if null_pct > 40.0:
                quality_warnings.append({
                    "column": col,
                    "type": "high_null_rate",
                    "message": f"Column '{col}' has {null_pct}% missing values.",
                })

            # Semantic type detection
            dtype_str = str(s.dtype)
            if pd.api.types.is_numeric_dtype(s):
                semantic_type = "numeric"
                numeric_cols.append(col)
            elif pd.api.types.is_datetime64_any_dtype(s):
                semantic_type = "datetime"
                datetime_cols.append(col)
            elif pd.api.types.is_bool_dtype(s):
                semantic_type = "boolean"
                categorical_cols.append(col)
            else:
                sample_valid = s.dropna().head(10).astype(str)
                is_date = False
                if len(sample_valid) > 0 and sample_valid.str.match(r"^\d{4}[-/]\d{1,2}[-/]\d{1,2}").all():
                    is_date = True

                if is_date:
                    semantic_type = "datetime"
                    datetime_cols.append(col)
                elif unique_count <= max(20, total_rows * 0.1):
                    semantic_type = "categorical"
                    categorical_cols.append(col)
                else:
                    semantic_type = "text"
                    if unique_count == total_rows and total_rows > 1:
                        quality_warnings.append({
                            "column": col,
                            "type": "potential_id_column",
                            "message": f"Column '{col}' contains unique identifiers for every row.",
                        })

            sample_vals = [None if pd.isna(v) else v for v in s.dropna().head(3).tolist()]

            columns_meta.append({
                "name": str(col),
                "dtype": dtype_str,
                "semantic_type": semantic_type,
                "null_count": null_count,
                "null_pct": null_pct,
                "unique_count": unique_count,
                "sample_values": sample_vals,
            })

        # Summary statistics for numeric columns
        numeric_stats: Dict[str, Dict[str, Any]] = {}
        if numeric_cols:
            num_desc = df[numeric_cols].describe().round(2).to_dict()
            for col in numeric_cols:
                if col in num_desc:
                    stat = num_desc[col]
                    numeric_stats[col] = {
                        "count": int(stat.get("count", 0)),
                        "mean": float(stat.get("mean", 0.0)) if not pd.isna(stat.get("mean")) else None,
                        "std": float(stat.get("std", 0.0)) if not pd.isna(stat.get("std")) else None,
                        "min": float(stat.get("min", 0.0)) if not pd.isna(stat.get("min")) else None,
                        "q25": float(stat.get("25%", 0.0)) if not pd.isna(stat.get("25%")) else None,
                        "median": float(stat.get("50%", 0.0)) if not pd.isna(stat.get("50%")) else None,
                        "q75": float(stat.get("75%", 0.0)) if not pd.isna(stat.get("75%")) else None,
                        "max": float(stat.get("max", 0.0)) if not pd.isna(stat.get("max")) else None,
                    }

        # Categorical top values
        categorical_stats: Dict[str, List[Dict[str, Any]]] = {}
        for col in categorical_cols:
            top_vals = df[col].value_counts().head(5).to_dict()
            categorical_stats[col] = [
                {"value": str(k), "count": int(v)} for k, v in top_vals.items()
            ]

        # Correlation matrix for numeric columns
        correlation_matrix: Dict[str, Dict[str, float]] = {}
        if len(numeric_cols) >= 2:
            try:
                corr = df[numeric_cols[:15]].corr().round(2).fillna(0)
                correlation_matrix = {
                    col: {c2: float(val) for c2, val in corr[col].items()}
                    for col in corr.columns
                }
            except Exception as e:
                logger.warning(f"Could not compute correlation: {e}")

        # Missing values report
        missing_report = [
            {"column": c["name"], "missing_count": c["null_count"], "missing_pct": c["null_pct"]}
            for c in columns_meta if c["null_count"] > 0
        ]

        # Outlier report
        outliers = self.detect_outliers(df, method="iqr")

        # Preview rows (cleaned for JSON)
        preview_df = df.head(15).copy()
        preview_records = preview_df.astype(object).where(pd.notna(preview_df), None).to_dict("records")

        return {
            "rows": total_rows,
            "columns": total_cols,
            "memory_mb": memory_mb,
            "duplicate_rows": duplicate_count,
            "duplicate_pct": duplicate_pct,
            "columns_meta": columns_meta,
            "numeric_columns": numeric_cols,
            "categorical_columns": categorical_cols,
            "datetime_columns": datetime_cols,
            "numeric_stats": numeric_stats,
            "categorical_stats": categorical_stats,
            "correlation_matrix": correlation_matrix,
            "missing_values_report": missing_report,
            "quality_warnings": quality_warnings,
            "outliers_report": outliers,
            "preview": preview_records,
        }

    def clean_dataset(
        self,
        dataset_id: str,
        operations: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Executes safe cleaning transformations on a dataset:
        - Preserves the raw uploaded file untouched.
        - Updates the processed working file.
        - Records an immutable audit log entry.
        """
        df = self.get_dataframe(dataset_id).copy()
        initial_rows = len(df)
        actions_performed: List[str] = []

        for item in operations:
            op = item.get("op")
            if op == "drop_duplicates":
                subset = item.get("subset")
                if subset:
                    subset = [c for c in subset if c in df.columns]
                before_dups = int(df.duplicated(subset=subset).sum())
                df = df.drop_duplicates(subset=subset)
                actions_performed.append(f"Dropped {before_dups} duplicate rows.")

            elif op == "drop_na":
                subset = item.get("subset")
                if subset:
                    subset = [c for c in subset if c in df.columns]
                how = item.get("how", "any")
                before_count = len(df)
                df = df.dropna(subset=subset, how=how)
                actions_performed.append(f"Dropped {before_count - len(df)} rows with missing values.")

            elif op == "impute":
                col = item.get("column")
                strategy = item.get("strategy", "mean")
                fill_val = item.get("fill_value")
                if col and col in df.columns:
                    missing_cnt = int(df[col].isna().sum())
                    if missing_cnt > 0:
                        if strategy == "mean" and pd.api.types.is_numeric_dtype(df[col]):
                            val = df[col].mean()
                            df[col] = df[col].fillna(round(val, 2))
                        elif strategy == "median" and pd.api.types.is_numeric_dtype(df[col]):
                            val = df[col].median()
                            df[col] = df[col].fillna(round(val, 2))
                        elif strategy == "mode":
                            mode_val = df[col].mode()
                            if not mode_val.empty:
                                df[col] = df[col].fillna(mode_val.iloc[0])
                        elif strategy == "constant" and fill_val is not None:
                            try:
                                if pd.api.types.is_numeric_dtype(df[col]):
                                    fill_val = float(fill_val)
                            except ValueError:
                                pass
                            df[col] = df[col].fillna(fill_val)
                        actions_performed.append(f"Imputed {missing_cnt} missing values in '{col}' using {strategy}.")

            elif op == "convert_type":
                col = item.get("column")
                target = item.get("target_type")
                if col and col in df.columns:
                    try:
                        if target == "numeric":
                            df[col] = pd.to_numeric(df[col], errors="coerce")
                        elif target == "datetime":
                            df[col] = pd.to_datetime(df[col], errors="coerce")
                        elif target == "string":
                            df[col] = df[col].astype(str)
                        actions_performed.append(f"Converted '{col}' to {target}.")
                    except Exception as e:
                        logger.warning(f"Could not convert column {col}: {e}")

        # Update cache and persist to processed file (leaving raw file intact)
        db = SessionLocal()
        try:
            ds = db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
            persist_path = ds.file_path if ds else os.path.join(settings.UPLOAD_DIR, f"processed_{dataset_id}.csv")
            self.set_dataframe(dataset_id, df, persist_path=persist_path)

            profile = self.profile_dataframe(df)

            audit_log = json.loads(ds.transformation_log_json) if ds and ds.transformation_log_json else []
            audit_log.append({
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "action": "clean",
                "operations": operations,
                "actions_performed": actions_performed,
                "rows_before": initial_rows,
                "rows_after": len(df),
            })

            if ds:
                ds.row_count = len(df)
                ds.col_count = len(df.columns)
                ds.profile_json = json.dumps(profile)
                ds.transformation_log_json = json.dumps(audit_log)
                db.commit()
        finally:
            db.close()

        return {
            "dataset_id": dataset_id,
            "rows_before": initial_rows,
            "rows_after": len(df),
            "rows_removed": initial_rows - len(df),
            "actions_performed": actions_performed,
            "audit_trail": audit_log,
            "updated_profile": profile,
        }

    # ==========================================
    # DETERMINISTIC PANDAS ANALYSIS TOOLS
    # ==========================================

    def aggregate_metric(
        self,
        dataset_id: str,
        metric_col: str,
        group_by_cols: List[str] | str,
        agg_func: str = "sum",
        sort_desc: bool = True,
        top_n: Optional[int] = 10,
        filters: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Calculates exact deterministic aggregations."""
        df = self.get_dataframe(dataset_id).copy()

        if isinstance(group_by_cols, str):
            group_by_cols = [group_by_cols]

        all_cols = list(group_by_cols) + ([metric_col] if agg_func != "count" else [])
        missing = [c for c in all_cols if c not in df.columns]
        if missing:
            raise HTTPException(
                status_code=422,
                detail=f"Columns not found in dataset: {', '.join(missing)}",
            )

        if filters:
            for f_col, f_val in filters.items():
                if f_col in df.columns:
                    if isinstance(f_val, list):
                        df = df[df[f_col].isin(f_val)]
                    else:
                        df = df[df[f_col] == f_val]

        if df.empty:
            return {
                "metric": metric_col,
                "group_by": group_by_cols,
                "agg_func": agg_func,
                "total_rows_used": 0,
                "results": [],
                "summary": {},
            }

        if agg_func != "count":
            df[metric_col] = pd.to_numeric(df[metric_col], errors="coerce")
            df = df.dropna(subset=[metric_col])

        df = df.dropna(subset=group_by_cols)

        agg_func_lower = agg_func.lower()
        valid_funcs = {"sum", "mean", "count", "min", "max", "median"}
        if agg_func_lower not in valid_funcs:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported agg_func '{agg_func}'. Allowed: {', '.join(valid_funcs)}",
            )

        grouped = df.groupby(group_by_cols, as_index=False)
        if agg_func_lower == "count":
            res = grouped.size().rename(columns={"size": "count"})
            value_col = "count"
        else:
            res = grouped[metric_col].agg(agg_func_lower)
            value_col = f"{agg_func_lower}_{metric_col}" if agg_func_lower != "sum" else metric_col
            res = res.rename(columns={metric_col: value_col})
            res[value_col] = res[value_col].round(2)

        res = res.sort_values(by=value_col, ascending=not sort_desc)

        total_groups = len(res)
        if top_n and top_n > 0:
            res = res.head(top_n)

        metric_values = res[value_col].tolist()
        summary = {
            "total_groups": total_groups,
            "overall_sum": round(float(res[value_col].sum()), 2) if agg_func_lower in {"sum", "count"} else None,
            "average": round(float(res[value_col].mean()), 2) if metric_values else None,
            "highest_group": res.iloc[0].to_dict() if not res.empty else None,
            "lowest_group": res.iloc[-1].to_dict() if not res.empty else None,
        }

        res_records = res.astype(object).where(pd.notna(res), None).to_dict("records")

        return {
            "metric": metric_col,
            "group_by": group_by_cols,
            "agg_func": agg_func_lower,
            "value_column": value_col,
            "total_rows_used": int(len(df)),
            "results": res_records,
            "summary": summary,
            "note": "Deterministic calculation computed by Python Pandas.",
        }

    def compare_groups(
        self,
        dataset_id: str,
        group_col: str,
        metric_cols: List[str],
        agg_funcs: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Compares multiple metrics across distinct groups."""
        df = self.get_dataframe(dataset_id).copy()
        if group_col not in df.columns:
            raise HTTPException(status_code=422, detail=f"Grouping column '{group_col}' not found.")

        valid_metrics = [m for m in metric_cols if m in df.columns]
        if not valid_metrics:
            raise HTTPException(status_code=422, detail="None of the specified metric columns exist in dataset.")

        funcs = agg_funcs or ["sum", "mean"]
        agg_dict = {}
        for m in valid_metrics:
            df[m] = pd.to_numeric(df[m], errors="coerce")
            agg_dict[m] = funcs

        df = df.dropna(subset=[group_col])
        grouped = df.groupby(group_col).agg(agg_dict).round(2)

        grouped.columns = [f"{col}_{fn}" for col, fn in grouped.columns]
        result = grouped.reset_index()

        return {
            "group_column": group_col,
            "metrics": valid_metrics,
            "results": result.astype(object).where(pd.notna(result), None).to_dict("records"),
            "note": "Multi-group comparative metrics computed deterministically by Pandas.",
        }

    def time_series_trend(
        self,
        dataset_id: str,
        date_col: str,
        metric_col: str,
        freq: str = "M",
        agg_func: str = "sum",
    ) -> Dict[str, Any]:
        """Analyzes time series trend over periods."""
        df = self.get_dataframe(dataset_id).copy()
        if date_col not in df.columns or metric_col not in df.columns:
            raise HTTPException(
                status_code=422,
                detail=f"Columns '{date_col}' or '{metric_col}' not found in dataset.",
            )

        df["parsed_date"] = pd.to_datetime(df[date_col], errors="coerce")
        df[metric_col] = pd.to_numeric(df[metric_col], errors="coerce")
        df = df.dropna(subset=["parsed_date", metric_col])

        if df.empty:
            return {"date_col": date_col, "metric_col": metric_col, "trend": []}

        df = df.sort_values("parsed_date")
        freq_map = {"D": "D", "W": "W", "M": "M", "Q": "Q", "Y": "Y"}
        period_freq = freq_map.get(freq.upper(), "M")

        df["period"] = df["parsed_date"].dt.to_period(period_freq).astype(str)
        grouped = df.groupby("period", as_index=False)[metric_col].agg(agg_func).round(2)

        grouped["pct_change"] = grouped[metric_col].pct_change().multiply(100).round(2).fillna(0)

        records = grouped.to_dict("records")

        return {
            "date_col": date_col,
            "metric_col": metric_col,
            "frequency": period_freq,
            "agg_func": agg_func,
            "trend": records,
            "note": "Time series aggregation computed deterministically by Pandas.",
        }

    def generate_chart_spec(
        self,
        chart_type: str,
        title: str,
        x_col: str,
        y_col: str,
        data: List[Dict[str, Any]],
        series_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Creates a structured chart specification."""
        return {
            "chart_type": chart_type,
            "title": title,
            "x_axis_key": x_col,
            "y_axis_key": y_col,
            "series_name": series_name or y_col,
            "data": data,
        }


# Global singleton instance
data_service = DataService()
