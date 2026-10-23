# DataPilot AI — Deployment & Production Guide

This guide details how to deploy **DataPilot AI** (FastAPI backend + React frontend + PostgreSQL database) for both local development and public cloud production environments.

---

## 1. Quickstart (Local Development)

### Prerequisites
- Python 3.10+ (tested on Python 3.12)
- Node.js 18+ (tested on Node 22)
- Git

### Step 1: Clone & Configure
```bash
git clone https://github.com/your-username/datapilot-ai.git
cd datapilot-ai
cp .env.example .env
```

### Step 2: Setup Python Backend
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Run full Pytest test suite
pytest tests/ -v

# Start FastAPI backend server
uvicorn app:app --reload --port 8000
```
Backend API interactive documentation is available at: `http://127.0.0.1:8000/docs`

### Step 3: Setup React Frontend
```bash
cd frontend
npm install
npm run dev
```
Open your browser at: `http://localhost:5173`

---

## 2. One-Command Local Deployment with Docker Compose

Run the complete production-identical stack (React + FastAPI + PostgreSQL) with Docker Compose:

```bash
docker-compose up --build
```
- **Frontend Dashboard**: `http://localhost:3000`
- **Backend REST API**: `http://localhost:8000`
- **PostgreSQL Database**: `localhost:5432`

---

## 3. Cloud Deployment (Render / Railway / Fly.io / Vercel)

### Option A: Backend on Render / Railway
1. **Repository**: Link your GitHub repository.
2. **Environment**: Docker or Python 3.12.
3. **Build Command**: `pip install -r requirements.txt`
4. **Start Command**: `uvicorn app:app --host 0.0.0.0 --port $PORT`
5. **Environment Variables**:
   - `LLM_PROVIDER`: `gemini` (or `openai`)
   - `GEMINI_API_KEY`: Your Google Gemini API Key
   - `DATABASE_URL`: Your managed PostgreSQL connection URL (e.g. from Neon, Supabase, or Render Postgres)
   - `CORS_ORIGINS`: `["https://your-frontend-app.vercel.app"]`

### Option B: Frontend on Vercel / Netlify
1. **Framework Preset**: Vite
2. **Root Directory**: `frontend`
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Environment Variable**:
   - `VITE_API_URL`: URL of your deployed FastAPI backend (e.g., `https://datapilot-api.onrender.com`)

---

## 4. Production Security & Reliability Best Practices

1. **Deterministic Guardrails**: The agent NEVER runs arbitrary code via `eval()` or `exec()`. All computations are conducted by strict Python Pandas methods.
2. **Rate Limiting**: Configured at 60 requests/minute per IP to guard against denial of service and runaway inference costs.
3. **Input Sanitization**: File uploads are capped at 15MB, bounded to 150,000 rows and 250 columns, and restricted strictly to `.csv` and `.xlsx` MIME types.
4. **Database Failover**: Automatically runs SQLite locally if `DATABASE_URL` is omitted, and seamlessly migrates to PostgreSQL for production environments.
