# DataPilot AI — SaaS Master Implementation Plan

> **Product**: DataPilot AI — Autonomous Data Analyst AI Agent SaaS Platform  
> **Status**: Active Implementation  
> **Architecture**: React 19 + TypeScript Frontend, FastAPI Python 3.12 Backend, PostgreSQL/SQLite Dual Persistence, LangGraph Agent Orchestrator  
> **Last Updated**: October 2026  

---

## 1. Project Audit & Current Baseline

| Module | Current Status | Completed Features | Missing / Next Steps for Full SaaS |
| :--- | :--- | :--- | :--- |
| **Backend Core** | 🟢 Operational | FastAPI lifespan, CORS, rate limiting, structured logging, Settings via Pydantic. | Add Alembic migrations, tenant context middleware. |
| **Data Engine** | 🟢 Operational | CSV & Excel reading, data profiling, summary stats, safe cleaning (dedup, impute, convert), aggregations, trends, comparisons. | Multi-sheet Excel workbook selector, IQR/Z-score outlier detection, data quality anomaly warnings, immutable source data retention with audit logs. |
| **AI Agent** | 🟢 Operational | LangGraph state graph (router → executor → synthesizer), typed Pydantic tool schemas, zero `eval`/`exec`, deterministic mock fallback. | Context memory across multiple turns, explicit column disambiguation clarification loop. |
| **Persistence** | 🟢 Operational | SQLite local fallback + PostgreSQL support, Dataset, Conversation, Message, and Document models. | User accounts, auth credentials, quota usage metrics, audit trail tables. |
| **Auth & Security** | 🟡 Partial | Rate limiting (60 req/min), file size limits (15MB), input validation. | Password hashing (bcrypt), JWT authentication tokens, per-user ownership authorization enforcement. |
| **Reporting & Export** | 🟡 Partial | CSV exports, JSON chart specifications. | Markdown/HTML/PDF executive report generation, download endpoints. |
| **Billing & SaaS** | ⚪ Planned | Conceptual tier design. | Server-side quota enforcement, subscription plan models, payment webhook boundary (Razorpay/Stripe). |
| **Frontend UI** | 🟢 Operational | Dark studio theme, upload drag-and-drop, sample preloading, KPI cards, table preview, AI chat, interactive Recharts. | Public marketing pages (Hero, Features, How It Works, Pricing, Privacy, Contact), Auth modals/pages, tabbed SaaS workspace navigation. |
| **Testing** | 🟢 Operational | 15 / 15 Pytest tests passing (100% pass rate). | Auth tests, multi-sheet tests, outlier detection tests, quota enforcement tests. |

---

## 2. Milestone Roadmap & Execution Tracker

### **Milestone 1: Project Audit, Architectural Design & SaaS Documentation** *(Current)*
- [x] Complete comprehensive codebase audit.
- [x] Create `docs/IMPLEMENTATION_PLAN.md`.
- [x] Create `docs/ARCHITECTURE.md`.
- [x] Create `docs/PRODUCT_SPECIFICATION.md`.
- [x] Create `docs/REVENUE_MODEL.md`.
- **Verification**: Document review and consistency check across files.

### **Milestone 2: Enhanced Data Engine (Multi-Sheet Excel, Outliers, Immutable Logging)**
- [ ] Implement worksheet extraction and sheet selection for multi-tab `.xlsx` files.
- [ ] Add outlier detection using IQR (Interquartile Range) and Z-score with documented mathematical methodology.
- [ ] Add data quality heuristic warnings (constant columns, high cardinality, extreme skewness).
- [ ] Ensure immutable storage of raw uploaded files; create an audit trail of cleaning transformations.
- **Verification**: New unit tests in `tests/test_data_engine.py` for sheet selection, outlier detection, and transformation audit logging.

### **Milestone 3: Executive Reporting & Multi-Format Exports**
- [ ] Build executive report generator (`backend/services/report_service.py`): Executive Summary, Data Quality Findings, Key Metrics, Methodologies, Recommendations.
- [ ] Support CSV, Markdown, and formatted HTML report downloads.
- [ ] Add automated report generation endpoints (`POST /api/datasets/{id}/report`).
- **Verification**: Automated test asserting report structure, accuracy of summary numbers, and export downloads.

### **Milestone 4: User Authentication & Per-User Tenant Data Isolation**
- [ ] Create `UserModel` and `TenantUsageModel` in SQLAlchemy.
- [ ] Implement secure password hashing (`pwdlib`/`passlib`/`bcrypt`) and JWT token issuing.
- [ ] Implement auth endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`.
- [ ] Enforce backend ownership checks: Users can only view, clean, query, and delete their own datasets and conversations.
- **Verification**: Security tests verifying unauthorized access rejection (401/403) and cross-tenant isolation.

### **Milestone 5: SaaS Usage Tracking & Quota Enforcer**
- [ ] Implement subscription tiers: `Free`, `Starter` (₹299/mo), `Pro` (₹999/mo), `Enterprise`.
- [ ] Track metric counters: datasets uploaded, rows processed, AI chat queries executed, reports generated.
- [ ] Enforce backend quotas before upload and analysis operations with clear upgrade prompts.
- **Verification**: Tests validating quota exhaustion responses (429/402).

### **Milestone 6: Payment Gateway Integration Boundary**
- [ ] Create payment provider integration interface (`backend/billing/payment_service.py`).
- [ ] Implement webhook receiver with signature validation for Razorpay / Stripe.
- [ ] Document sandbox credentials, checkout flows, and compliance notes.
- **Verification**: Mock webhook test verifying subscription activation upon verified payment event.

### **Milestone 7: Public SaaS Marketing Pages & Navigation**
- [ ] Expand frontend to include:
  - Landing Page: Hero, Feature grid, "How It Works", Live interactive demo sandbox.
  - Pricing Page: Tier comparisons, plan feature breakdowns, FAQ.
  - Privacy & Data Security Page: Zero-retention policy, encryption in transit, non-training clause.
  - Contact & Support Form: Inquiry submission with validation.
  - Auth Modals: Sign-in and Registration with validation.
- [ ] Responsive header with mobile drawer navigation and tabbed app switcher.
- **Verification**: Frontend compilation check (`npm run build`) and component rendering.

### **Milestone 8: Quantitative Agent Evaluation & Benchmarks**
- [ ] Create evaluation harness (`backend/evaluation/benchmark.py`) with 10 golden analytical test queries against `sample_sales.csv`.
- [ ] Measure: numerical accuracy (target 100%), tool selection accuracy, query response latency, token cost estimation.
- [ ] Generate `docs/EVALUATION.md` recording actual measured metrics.
- **Verification**: Run evaluation script and verify zero calculation discrepancy.

### **Milestone 9: Deployment Verification & CI Automation**
- [ ] Update Dockerfiles and `docker-compose.yml` for multi-tenant production.
- [ ] Configure GitHub Actions CI workflow (`.github/workflows/ci.yml`) for automated linting, backend tests, and frontend build.
- [ ] Verify live application readiness.
