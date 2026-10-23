from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from backend.services.data_service import data_service


class ReportService:
    def generate_report_data(self, dataset_id: str, title: Optional[str] = None) -> Dict[str, Any]:
        """Compiles a complete structured analytical report from dataset metrics."""
        df = data_service.get_dataframe(dataset_id)
        profile = data_service.profile_dataframe(df)

        report_title = title or f"Executive Data Analysis Report — {dataset_id[:8]}"
        generated_at = datetime.now(timezone.utc).strftime("%B %d, %Y at %H:%M UTC")

        # Summary KPIs
        total_rows = profile["rows"]
        total_cols = profile["columns"]
        dup_count = profile["duplicate_rows"]
        missing_count = sum(m["missing_count"] for m in profile["missing_values_report"])

        # Health score calculation (out of 100)
        penalty = min(50, (missing_count / (total_rows * total_cols or 1)) * 200) + min(30, (dup_count / (total_rows or 1)) * 100)
        health_score = max(20, round(100 - penalty))

        # Compile numeric highlights
        numeric_highlights = []
        for col, stats in profile.get("numeric_stats", {}).items():
            if stats.get("mean") is not None:
                numeric_highlights.append({
                    "metric": col,
                    "mean": stats["mean"],
                    "min": stats["min"],
                    "max": stats["max"],
                    "std": stats["std"],
                })

        # Key categorical breakdown
        categorical_highlights = []
        for col, items in profile.get("categorical_stats", {}).items():
            if items:
                categorical_highlights.append({
                    "dimension": col,
                    "top_value": items[0]["value"],
                    "top_count": items[0]["count"],
                    "top_share_pct": round(items[0]["count"] / total_rows * 100, 1) if total_rows > 0 else 0,
                })

        # Outlier count
        total_outliers = sum(o["outlier_count"] for o in profile.get("outliers_report", {}).values())

        # Recommended analytical questions
        recommended_questions = []
        if profile.get("datetime_columns") and profile.get("numeric_columns"):
            recommended_questions.append(f"What is the chronological growth trend of {profile['numeric_columns'][0]} over time?")
        if profile.get("categorical_columns") and profile.get("numeric_columns"):
            recommended_questions.append(f"Which {profile['categorical_columns'][0]} accounts for the highest share of {profile['numeric_columns'][0]}?")
        if len(profile.get("numeric_columns", [])) >= 2:
            recommended_questions.append(f"What is the statistical correlation between {profile['numeric_columns'][0]} and {profile['numeric_columns'][1]}?")
        recommended_questions.append("Are there any seasonal variance patterns or localized operational bottlenecks?")

        return {
            "title": report_title,
            "generated_at": generated_at,
            "dataset_id": dataset_id,
            "health_score": health_score,
            "total_rows": total_rows,
            "total_columns": total_cols,
            "duplicate_rows": dup_count,
            "total_missing": missing_count,
            "total_outliers": total_outliers,
            "numeric_highlights": numeric_highlights,
            "categorical_highlights": categorical_highlights,
            "quality_warnings": profile.get("quality_warnings", []),
            "missing_report": profile.get("missing_values_report", []),
            "outliers_report": profile.get("outliers_report", []),
            "recommended_questions": recommended_questions,
        }

    def render_markdown_report(self, report_data: Dict[str, Any]) -> str:
        """Renders report data as structured GitHub Flavored Markdown."""
        d = report_data
        md = []

        md.append(f"# {d['title']}\n")
        md.append(f"**Generated**: {d['generated_at']} | **Dataset ID**: `{d['dataset_id']}`\n")
        md.append("---\n")

        md.append("## 1. Executive Summary\n")
        md.append(f"- **Data Quality Health Score**: **{d['health_score']} / 100**")
        md.append(f"- **Dataset Scale**: **{d['total_rows']:,} rows** across **{d['total_columns']} dimensions**.")
        md.append(f"- **Integrity Status**: {d['duplicate_rows']} duplicate rows detected; {d['total_missing']} missing values across all columns.")
        md.append(f"- **Statistical Outliers**: {d['total_outliers']} data points flagged via Interquartile Range (IQR 1.5× rule).\n")

        md.append("## 2. Key Quantitative Metrics\n")
        if d["numeric_highlights"]:
            md.append("| Metric | Average (Mean) | Min | Max | Std Dev |")
            md.append("| :--- | :--- | :--- | :--- | :--- |")
            for h in d["numeric_highlights"]:
                md.append(f"| `{h['metric']}` | {h['mean']:,.2f} | {h['min']:,.2f} | {h['max']:,.2f} | {h['std']:,.2f} |")
            md.append("")
        else:
            md.append("No continuous numeric dimensions detected.\n")

        md.append("## 3. Categorical Distribution\n")
        if d["categorical_highlights"]:
            md.append("| Dimension | Top Dominant Value | Volume | Share (%) |")
            md.append("| :--- | :--- | :--- | :--- |")
            for c in d["categorical_highlights"]:
                md.append(f"| `{c['dimension']}` | **{c['top_value']}** | {c['top_count']:,} | {c['top_share_pct']}% |")
            md.append("")

        md.append("## 4. Data Quality & Anomaly Audit\n")
        if d["quality_warnings"]:
            for w in d["quality_warnings"]:
                md.append(f"- ⚠️ **{w['type'].replace('_', ' ').title()}** on `{w['column']}`: {w['message']}")
        else:
            md.append("- ✅ Zero structural data quality anomalies detected.")
        md.append("")

        md.append("## 5. Methodology & Caveats\n")
        md.append("- All mathematical calculations are computed deterministically via standard Python Pandas libraries.")
        md.append("- Outlier detection utilizes the non-parametric Tukey Interquartile Range ($Q_1 - 1.5 \\times \\text{IQR}$, $Q_3 + 1.5 \\times \\text{IQR}$).")
        md.append("- Statistical correlation represents linear Pearson correlation and does not imply causation.\n")

        md.append("## 6. Recommended Next Analytical Inquiries\n")
        for q in d["recommended_questions"]:
            md.append(f"1. {q}")

        return "\n".join(md)

    def render_html_report(self, report_data: Dict[str, Any]) -> str:
        """Renders an executive-ready, printable HTML report."""
        d = report_data
        md_text = self.render_markdown_report(report_data)

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{d['title']}</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      max-width: 860px;
      margin: 40px auto;
      padding: 0 20px;
    }}
    h1 {{ color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }}
    h2 {{ color: #334155; margin-top: 30px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; }}
    .badge {{
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-weight: 600;
      font-size: 0.85rem;
      background: #e0e7ff;
      color: #4338ca;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }}
    th, td {{
      padding: 10px 14px;
      border: 1px solid #e2e8f0;
      text-align: left;
      font-size: 0.9rem;
    }}
    th {{ background: #f8fafc; font-weight: 600; }}
    .footer {{
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      font-size: 0.8rem;
      color: #64748b;
      text-align: center;
    }}
  </style>
</head>
<body>
  <h1>{d['title']}</h1>
  <p><strong>Generated:</strong> {d['generated_at']} &bull; <strong>Health Score:</strong> <span class="badge">{d['health_score']} / 100</span></p>

  <h2>Executive Summary</h2>
  <ul>
    <li><strong>Dataset Scale:</strong> {d['total_rows']:,} rows &times; {d['total_columns']} dimensions.</li>
    <li><strong>Integrity:</strong> {d['duplicate_rows']} duplicate records, {d['total_missing']} missing values.</li>
    <li><strong>Anomalies:</strong> {d['total_outliers']} statistical outliers identified.</li>
  </ul>

  <h2>Numeric Highlights</h2>
  <table>
    <thead>
      <tr>
        <th>Metric</th>
        <th>Mean</th>
        <th>Min</th>
        <th>Max</th>
        <th>Std Dev</th>
      </tr>
    </thead>
    <tbody>
      {''.join(f"<tr><td><strong>{h['metric']}</strong></td><td>{h['mean']:,.2f}</td><td>{h['min']:,.2f}</td><td>{h['max']:,.2f}</td><td>{h['std']:,.2f}</td></tr>" for h in d['numeric_highlights'])}
    </tbody>
  </table>

  <h2>Recommended Next Inquiries</h2>
  <ol>
    {''.join(f"<li>{q}</li>" for q in d['recommended_questions'])}
  </ol>

  <div class="footer">
    Report generated deterministically by DataPilot AI &bull; No LLM hallucination of numerical calculations
  </div>
</body>
</html>"""


report_service = ReportService()
