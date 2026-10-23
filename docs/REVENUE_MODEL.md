# DataPilot AI — SaaS Revenue & Business Model

## 1. Executive Monetization Strategy

DataPilot AI operates on a dual monetization model designed to capture immediate service revenue while building long-term recurring SaaS subscription value:

```text
                  ┌────────────────────────────────────────────────────────┐
                  │                 DataPilot AI Revenue                   │
                  └──────────────────────────┬─────────────────────────────┘
                                             │
                   ┌─────────────────────────┴────────────────────────┐
                   ▼                                                  ▼
      Channel A: Analytics Services                      Channel B: Self-Service SaaS
   - Custom report generation                         - Free Trial / Freemium Demo
   - Data cleaning & auditing projects                - Starter Plan (₹299/mo)
   - Enterprise dashboard setups                      - Professional Plan (₹999/mo)
   - Fixed project fees (₹5,000 - ₹50,000)            - Business / Enterprise (Custom)
```

---

## 2. Subscription Pricing Tiers (Hypotheses for Market Validation)

| Plan | Price (INR / Month) | Target User | Upload Limits | Monthly Analyses | Core Features |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Free Demo** | ₹0 | Students, evaluators | 5 MB, max 5,000 rows | 20 queries / mo | Full profiling, sample datasets, basic charts, standard chat. |
| **Starter** | ₹299 / mo | Freelancers, shop owners | 15 MB, max 50,000 rows | 250 queries / mo | CSV/XLSX multi-sheet, data cleaning studio, CSV exports, saved history. |
| **Professional** | ₹999 / mo | Data analysts, SMB teams | 50 MB, max 150,000 rows | 1,000 queries / mo | Executive report generation, PDF RAG document upload, priority processing, email support. |
| **Business** | Custom | Multi-user organizations | 200 MB+, custom rows | Unlimited / custom | Multi-seat workspaces, audit logs, custom integrations, dedicated support. |

*Note: These are initial pricing hypotheses subject to empirical willingness-to-pay validation and unit economics analysis.*

---

## 3. Unit Economics & Cost-Per-Analysis Estimation

### Variable Costs (Per Query)
1. **LLM Inference**:
   * Model: Google Gemini 1.5 Flash or GPT-4o-mini.
   * Typical Prompt: ~1,000 input tokens (system instructions + tool results).
   * Typical Completion: ~300 output tokens (executive summary).
   * Gemini 1.5 Flash input cost: ~$0.075 / 1M tokens ($0.000075 / query).
   * Gemini 1.5 Flash output cost: ~$0.30 / 1M tokens ($0.00009 / query).
   * **Total LLM cost per analysis**: **~$0.000165 (~₹0.014 INR)**.

2. **Compute & Storage**:
   * In-memory Pandas execution: negligible incremental compute cost.
   * Database storage: negligible at 100MB per tenant.

### Gross Margin Analysis
* **Starter Plan (₹299/month)**:
  * Maximum 250 queries × ₹0.014 = ₹3.50 in LLM costs.
  * Payment gateway fee (Razorpay ~2%): ₹6.00.
  * Hosting amortized: ~₹20.00.
  * **Gross Profit**: ~₹269.50 (~90% Gross Margin).

* **Professional Plan (₹999/month)**:
  * Maximum 1,000 queries × ₹0.014 = ₹14.00 in LLM costs.
  * Payment gateway fee (Razorpay ~2%): ₹20.00.
  * Hosting amortized: ~₹40.00.
  * **Gross Profit**: ~₹925.00 (~92% Gross Margin).

---

## 4. Quota Enforcement & Overuse Guardrails

1. **Backend-Enforced Limits**:
   * Quotas are checked at the API layer (`backend/services/quota_service.py`), preventing client-side bypass.
   * If an account exceeds its monthly query allocation or file size limit, the backend returns `402 Payment Required` or `429 Too Many Requests` with a structured upgrade payload.
2. **Transparent Usage Tracking**:
   * Users can view their current monthly consumption, remaining queries, and reset dates directly on their Account Settings tab.

---

## 5. Payment Gateway Architecture (Razorpay / Stripe)

### Provider Selection
* **Domestic (India)**: **Razorpay** (Supports UPI, RuPay, NetBanking, Credit/Debit cards).
* **International**: **Stripe** (Supports global credit cards, Apple Pay, Google Pay).

### Security & Compliance Principles
1. **Zero Card Storage**: Payment credentials are never ingested, transmitted, or stored on DataPilot AI servers. All transactions leverage hosted checkouts or PCI-DSS compliant tokenization.
2. **Cryptographic Webhook Verification**:
   * Webhook requests from Razorpay / Stripe are validated using HMAC-SHA256 signatures with a secret webhook key (`PAYMENT_WEBHOOK_SECRET`).
   * Unsigned or invalid requests are immediately rejected.
3. **Idempotent Billing Events**:
   * Payment events (`payment.captured`, `subscription.activated`, `subscription.cancelled`) record an idempotency key to prevent double credits.
