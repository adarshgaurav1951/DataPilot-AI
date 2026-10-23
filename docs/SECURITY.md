# DataPilot AI — Application Security & Data Protection Specification

## 1. Security Architecture Principles

DataPilot AI is engineered around strict defense-in-depth security principles to protect customer spreadsheets, financial metrics, and operational data:

```text
       Incoming Request
              │
              ▼
   ┌──────────────────────────────────────────────┐
   │ 1. Network & Rate Limiting Guard             │ -> Max 60 req/min per IP/Tenant
   └──────────────────────┬───────────────────────┘
                          │
                          ▼
   ┌──────────────────────────────────────────────┐
   │ 2. Authentication & Authorization Gateway    │ -> JWT signature & Tenant Ownership
   └──────────────────────┬───────────────────────┘
                          │
                          ▼
   ┌──────────────────────────────────────────────┐
   │ 3. Strict Input & Upload Sanitization        │ -> 15MB limit, MIME checks, no macros
   └──────────────────────┬───────────────────────┘
                          │
                          ▼
   ┌──────────────────────────────────────────────┐
   │ 4. Deterministic Sandboxed Execution         │ -> Pre-compiled Pandas tools ONLY
   │    (ZERO eval / exec / raw code)             │    Zero dynamic code generation
   └──────────────────────┬───────────────────────┘
                          │
                          ▼
   ┌──────────────────────────────────────────────┐
   │ 5. Audit Logging & Non-Training Storage      │ -> Immutable raw copies, no LLM training
   └──────────────────────────────────────────────┘
```

---

## 2. Threat Vector Mitigations

| Threat Vector | Potential Risk | DataPilot AI Mitigation |
| :--- | :--- | :--- |
| **Remote Code Execution (RCE)** | An LLM or attacker executes malicious Python code on the server. | **Total Architectural Elimination**: The LLM is never connected to an `eval()`, `exec()`, or subshell runner. All calculations execute through pre-compiled, parameter-checked Python functions. |
| **Prompt Injection** | User prompt instructs agent to ignore rules or leak other datasets. | **Schema & Tool Allowlisting**: The agent can only select allowlisted tools with validated Pydantic schemas. System prompts separate user queries from system context. |
| **Cross-Tenant Data Leakage** | User A accesses User B's uploaded spreadsheet or chat history. | **Strict Backend Ownership Checks**: Every dataset, conversation, and report query filters by `user_id`. Direct URL guessing is blocked with `404 Not Found`. |
| **Denial of Service (DoS)** | Attacker uploads gigabyte-sized files or floods analytical endpoints. | **Sliding Window Rate Limiter**: 60 requests/minute per IP. **Upload Caps**: Hard 15MB file size limit, 150,000 row limit, and 250 column limit enforced before parsing. |
| **Credential & Secret Exposure** | API keys or user passwords exposed in git or server logs. | **PBKDF2 Password Hashing**: Passwords stored as `salt$hash` using PBKDF2-HMAC-SHA256 with 100,000 iterations. API keys loaded exclusively via environment variables. Sensitive data excluded from logs. |
| **Public File Exposure** | Uploaded spreadsheets accessible via public static URLs. | **Private File Vault**: Uploaded files are stored in private local directories (`data/uploads/`) and are accessible only via authenticated endpoints. |

---

## 3. Data Confidentiality & Non-Training Policy

1. **Zero LLM Training**:
   - Customer dataset records, column contents, and analytical queries are **never** used to train, retrain, or fine-tune public foundation models.
2. **Data Retention & Right to Erasure**:
   - Users can delete any dataset directly from their workspace.
   - Deletion removes the working CSV, the immutable raw upload file, all profile metadata, and all associated conversation history from the database.
3. **Audit Logging**:
   - Cleaning operations record an immutable audit trail (`transformation_log`) documenting the exact timestamp, operations performed, and rows modified.
