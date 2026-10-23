# DataPilot AI — Product Specification Document

## 1. Executive Summary

* **Product Name**: DataPilot AI
* **Category**: AI Data Analyst SaaS
* **Core Value Proposition**: *"Turn your spreadsheets into clear answers, interactive charts, and actionable business insights using AI — without requiring Python, SQL, or statistics."*
* **Target Audience**: Small & medium businesses, ecommerce store managers, freelance data analysts, operations teams, researchers, and students who rely on CSV and Excel spreadsheets.

---

## 2. User Personas & Core Use Cases

| Persona | Background & Pain Point | How DataPilot AI Solves It |
| :--- | :--- | :--- |
| **Rajesh (Online Store Owner)** | Sells electronics across 4 marketplaces. Has 50,000 sales rows in Excel, wants to know top-selling categories and monthly growth without learning pivot tables. | Uploads `sales.xlsx`, asks *"Which product category yielded the highest profit margin?"*, gets calculated metrics and an instant bar chart. |
| **Priya (Freelance Marketing Analyst)** | Manages campaign lead sheets for multiple clients. Needs to clean duplicate submissions and produce client-ready executive reports quickly. | Uses Cleaning Studio to impute missing values, asks for channel comparisons, and exports a formatted executive summary report. |
| **Amit (Operations Lead)** | Tracks warehouse fulfillment metrics. Wants to inspect anomalies and verify data quality before meetings. | Uploads spreadsheet, gets an instant data health audit, outlier warnings, and asks for daily delivery time trends. |

---

## 3. Detailed Feature Specifications

### 3.1 Dataset Ingestion & Validation
* **Supported Formats**: `.csv` (auto delimiter and Latin-1/UTF-8 detection) and `.xlsx` / `.xls` (multi-worksheet support).
* **Worksheet Selector**: If an uploaded Excel file has multiple sheets, the user is presented with a dropdown to select which worksheet to analyze.
* **Constraints**:
  * Max file size: 15 MB.
  * Max row count: 150,000 rows.
  * Max column count: 250 columns.
* **Preloaded Demo Datasets**: Instant access to `sample_sales.csv` and `sample_sales.xlsx` with realistic sales, revenue, profit, and regional data for evaluation without needing local files.

### 3.2 Data Profiling & Health Auditing
* **Dimensions**: Total records, total columns, memory footprint.
* **Semantic Schema Inference**:
  * `numeric`: Integers, floats, currency.
  * `categorical`: Low-cardinality discrete values.
  * `datetime`: Timestamps and formatted date strings.
  * `boolean`: True/false flags.
  * `text`: Freeform strings or high-cardinality values.
* **Missing Value Analysis**: Count and percentage per column with quality ratings.
* **Duplicate Detection**: Identifies exact and subset duplicate rows.
* **Summary Statistics**:
  * Numeric: Count, mean, standard deviation, minimum, 25th percentile, median, 75th percentile, maximum.
  * Categorical: Top 5 most frequent values and frequencies.
* **Correlation Matrix**: Pearson correlation across all numeric dimensions.
* **Data Quality Warnings**: Flags columns with >50% missing values, zero variance (constant columns), or high cardinality.

### 3.3 Outlier Detection & Anomaly Warnings
* **IQR Method**: Points falling below $Q_1 - 1.5 \times \text{IQR}$ or above $Q_3 + 1.5 \times \text{IQR}$ are flagged as outliers.
* **Z-Score Method**: Points with absolute standard score $|Z| > 3$ are flagged.
* Clear methodology documentation is presented to the user to avoid confusion.

### 3.4 Data Cleaning Studio
* Non-destructive operations that preserve raw uploaded data:
  * **Drop Duplicates**: Removes exact duplicate records and logs count removed.
  * **Missing Value Imputation**: Supports `mean`, `median`, `mode`, or a custom constant value.
  * **Type Coercion**: Converts strings to numeric or datetime where applicable.
* Generates an audit trail of changes and provides an updated live profile.

### 3.5 AI Analyst Conversational Workspace
* **Natural Language Queries**: Users can ask analytical questions such as:
  * *"Which region generated the most revenue?"*
  * *"Show monthly sales trend over time"*
  * *"Compare profit and revenue by category"*
  * *"Audit data health, missing values and duplicates"*
* **Strict Calculation Guardrail**: The AI does not compute numbers in its neural network. It invokes deterministic Python Pandas functions and cites exact calculated numbers.
* **Execution Transparency**: Displays tool badges (e.g., `Tool: aggregate_metric()`) to indicate what operations were performed.
* **Interactive Visualizations**: Renders Recharts graphs (Bar, Line, Pie) with a toggle to view the underlying data table.

### 3.6 Executive Reporting & Exports
* One-click generation of comprehensive analytical reports containing:
  * Executive Summary.
  * Dataset Overview & Dimensions.
  * Data Quality & Anomaly Findings.
  * Key Business Metrics & Calculations.
  * Analytical Caveats & Recommended Next Questions.
* Export formats: Clean CSV data export, Markdown report, and printable HTML report.

### 3.7 Optional Reference Document RAG
* Upload reference documentation (e.g. data dictionaries, KPI formula sheets, company policies).
* Performs lexical/semantic chunk retrieval using `pypdf`.
* Answers include exact document name and page number citations.

---

## 4. Non-Functional Requirements

* **Correctness**: Zero tolerance for invented numbers. All statistics must match Pandas standard computations.
* **Performance**: Profiling of 10,000-row datasets completes within 1.5 seconds.
* **Security**: Files are not publicly exposed. Passwords hashed with bcrypt. Rate limits enforced at 60 req/min.
* **Usability**: Accessible on desktop and mobile browsers, zero coding required.
