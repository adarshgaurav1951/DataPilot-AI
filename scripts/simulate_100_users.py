import asyncio
import json
import os
import random
import sys
import time
from typing import Any, Dict, List
import httpx

BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8000")

# User simulation results collector
results = {
    "total_users": 100,
    "completed_users": 0,
    "failed_users": 0,
    "total_requests": 0,
    "successful_requests": 0,
    "failed_requests": 0,
    "latencies": [],
    "cohort_stats": {
        "Financial Analysts (30)": {"success": 0, "fail": 0, "reqs": 0},
        "Data Engineers (25)": {"success": 0, "fail": 0, "reqs": 0},
        "Executives (20)": {"success": 0, "fail": 0, "reqs": 0},
        "Compliance Researchers (15)": {"success": 0, "fail": 0, "reqs": 0},
        "SaaS Account Users (10)": {"success": 0, "fail": 0, "reqs": 0},
    },
    "errors": [],
}


async def record_request(client: httpx.AsyncClient, method: str, url: str, cohort: str, **kwargs) -> httpx.Response:
    start_t = time.perf_counter()
    results["total_requests"] += 1
    results["cohort_stats"][cohort]["reqs"] += 1
    try:
        resp = await client.request(method, url, **kwargs)
        duration = (time.perf_counter() - start_t) * 1000
        results["latencies"].append(duration)
        if resp.status_code in [200, 201]:
            results["successful_requests"] += 1
        else:
            results["failed_requests"] += 1
            if len(results["errors"]) < 10:
                results["errors"].append(f"HTTP {resp.status_code} on {method} {url}: {resp.text[:100]}")
        return resp
    except Exception as e:
        results["failed_requests"] += 1
        if len(results["errors"]) < 10:
            results["errors"].append(f"Network error on {method} {url}: {str(e)[:100]}")
        raise


# =====================================================================
# COHORT 1: FINANCIAL ANALYSTS (30 Users)
# Load sales data -> Revenue by region -> Monthly trend -> Direct analysis
# =====================================================================
async def simulate_financial_analyst(user_id: int, client: httpx.AsyncClient):
    cohort = "Financial Analysts (30)"
    try:
        # Step 1: Load sample sales data
        load_resp = await record_request(client, "POST", f"{BASE_URL}/api/load-sample?file_type=csv", cohort)
        if load_resp.status_code != 200:
            results["cohort_stats"][cohort]["fail"] += 1
            return
        dataset_id = load_resp.json()["dataset_id"]

        # Step 2: Query AI agent for top revenue by region
        chat1 = await record_request(
            client,
            "POST",
            f"{BASE_URL}/api/chat",
            cohort,
            json={"dataset_id": dataset_id, "message": "Which region generated the most revenue?"},
        )
        if chat1.status_code != 200:
            results["cohort_stats"][cohort]["fail"] += 1
            return
        conv_id = chat1.json().get("conversation_id")

        # Step 3: Multi-turn follow up: Monthly revenue trend
        chat2 = await record_request(
            client,
            "POST",
            f"{BASE_URL}/api/chat",
            cohort,
            json={
                "dataset_id": dataset_id,
                "conversation_id": conv_id,
                "message": "Show monthly revenue trend over time",
            },
        )
        if chat2.status_code != 200:
            results["cohort_stats"][cohort]["fail"] += 1
            return

        # Step 4: Run direct calculation
        await record_request(
            client,
            "POST",
            f"{BASE_URL}/api/datasets/{dataset_id}/analyze",
            cohort,
            json={
                "tool": "aggregate",
                "metric_col": "revenue",
                "group_by_cols": ["region"],
                "agg_func": "sum",
            },
        )

        results["completed_users"] += 1
        results["cohort_stats"][cohort]["success"] += 1
    except Exception:
        results["failed_users"] += 1
        results["cohort_stats"][cohort]["fail"] += 1


# =====================================================================
# COHORT 2: DATA ENGINEERS (25 Users)
# Upload raw dirty CSV -> Audit data health -> Drop duplicates -> Re-audit
# =====================================================================
async def simulate_data_engineer(user_id: int, client: httpx.AsyncClient):
    cohort = "Data Engineers (25)"
    try:
        # Step 1: Upload a CSV containing nulls & duplicates
        csv_content = (
            f"order_id,product,revenue,channel\n"
            f"101,Laptop,1200,Online\n"
            f"101,Laptop,1200,Online\n"
            f"102,Phone,,Retail\n"
            f"103,Monitor,300,Online\n"
            f"103,Monitor,300,Online\n"
        ).encode("utf-8")

        upload_resp = await record_request(
            client,
            "POST",
            f"{BASE_URL}/api/upload",
            cohort,
            files={"file": (f"user_{user_id}_data.csv", csv_content, "text/csv")},
        )
        if upload_resp.status_code != 200:
            results["cohort_stats"][cohort]["fail"] += 1
            return
        dataset_id = upload_resp.json()["dataset_id"]

        # Step 2: Audit data health
        await record_request(
            client,
            "POST",
            f"{BASE_URL}/api/chat",
            cohort,
            json={"dataset_id": dataset_id, "message": "Check data health, missing values and duplicate rows"},
        )

        # Step 3: Clean data (drop duplicates and fill missing)
        clean_resp = await record_request(
            client,
            "POST",
            f"{BASE_URL}/api/datasets/{dataset_id}/clean",
            cohort,
            json={
                "operations": [
                    {"op": "drop_duplicates"},
                    {"op": "fill_missing", "params": {"column": "revenue", "strategy": "zero"}},
                ]
            },
        )
        if clean_resp.status_code != 200:
            results["cohort_stats"][cohort]["fail"] += 1
            return

        # Step 4: Verify clean profile
        await record_request(
            client,
            "POST",
            f"{BASE_URL}/api/chat",
            cohort,
            json={"dataset_id": dataset_id, "message": "Check data health after cleaning"},
        )

        results["completed_users"] += 1
        results["cohort_stats"][cohort]["success"] += 1
    except Exception:
        results["failed_users"] += 1
        results["cohort_stats"][cohort]["fail"] += 1


# =====================================================================
# COHORT 3: EXECUTIVES (20 Users)
# Load dataset -> Compare groups -> Top N ranking -> Generate PDF/HTML report
# =====================================================================
async def simulate_executive(user_id: int, client: httpx.AsyncClient):
    cohort = "Executives (20)"
    try:
        # Step 1: Load sample data
        load_resp = await record_request(client, "POST", f"{BASE_URL}/api/load-sample?file_type=csv", cohort)
        if load_resp.status_code != 200:
            results["cohort_stats"][cohort]["fail"] += 1
            return
        dataset_id = load_resp.json()["dataset_id"]

        # Step 2: Multi-metric comparison query
        await record_request(
            client,
            "POST",
            f"{BASE_URL}/api/chat",
            cohort,
            json={"dataset_id": dataset_id, "message": "Compare revenue and profit across region"},
        )

        # Step 3: Top ranking query
        await record_request(
            client,
            "POST",
            f"{BASE_URL}/api/chat",
            cohort,
            json={"dataset_id": dataset_id, "message": "Show top 3 categories by revenue"},
        )

        # Step 4: Generate executive report
        await record_request(
            client,
            "POST",
            f"{BASE_URL}/api/datasets/{dataset_id}/report",
            cohort,
            params={"title": f"Executive Quarterly Briefing #{user_id}"},
        )

        # Step 5: Export CSV
        await record_request(
            client,
            "GET",
            f"{BASE_URL}/api/datasets/{dataset_id}/export?format=csv",
            cohort,
        )

        results["completed_users"] += 1
        results["cohort_stats"][cohort]["success"] += 1
    except Exception:
        results["failed_users"] += 1
        results["cohort_stats"][cohort]["fail"] += 1


# =====================================================================
# COHORT 4: COMPLIANCE & RESEARCHERS (15 Users)
# Load data -> RAG policy inquiry -> Anomaly & outlier inquiry
# =====================================================================
async def simulate_compliance_researcher(user_id: int, client: httpx.AsyncClient):
    cohort = "Compliance Researchers (15)"
    try:
        # Step 1: Load sample data
        load_resp = await record_request(client, "POST", f"{BASE_URL}/api/load-sample?file_type=csv", cohort)
        if load_resp.status_code != 200:
            results["cohort_stats"][cohort]["fail"] += 1
            return
        dataset_id = load_resp.json()["dataset_id"]

        # Step 2: Policy & RAG inquiry
        await record_request(
            client,
            "POST",
            f"{BASE_URL}/api/chat",
            cohort,
            json={
                "dataset_id": dataset_id,
                "message": "What is the policy or standard definition for regional revenue KPI?",
            },
        )

        # Step 3: Outlier & statistical anomaly detection
        await record_request(
            client,
            "POST",
            f"{BASE_URL}/api/chat",
            cohort,
            json={
                "dataset_id": dataset_id,
                "message": "Detect any unusual outliers or anomalies in the numbers",
            },
        )

        results["completed_users"] += 1
        results["cohort_stats"][cohort]["success"] += 1
    except Exception:
        results["failed_users"] += 1
        results["cohort_stats"][cohort]["fail"] += 1


# =====================================================================
# COHORT 5: SAAS POWER USERS (10 Users)
# Register -> Login -> Check Quota -> Run Authenticated Agent Chat
# =====================================================================
async def simulate_saas_user(user_id: int, client: httpx.AsyncClient):
    cohort = "SaaS Account Users (10)"
    try:
        email = f"sim_user_{user_id}_{random.randint(1000, 9999)}@datapilot.ai"
        password = "SecurePassword123!"

        # Step 1: Register account
        reg_resp = await record_request(
            client,
            "POST",
            f"{BASE_URL}/api/auth/register",
            cohort,
            json={"email": email, "password": password, "full_name": f"Simulated User {user_id}"},
        )
        if reg_resp.status_code != 200:
            results["cohort_stats"][cohort]["fail"] += 1
            return
        token = reg_resp.json()["access_token"]
        auth_headers = {"Authorization": f"Bearer {token}"}

        # Step 2: Check subscription status and quotas
        await record_request(
            client,
            "GET",
            f"{BASE_URL}/api/billing/subscription",
            cohort,
            headers=auth_headers,
        )

        # Step 3: Load sample data
        load_resp = await record_request(
            client,
            "POST",
            f"{BASE_URL}/api/load-sample?file_type=csv",
            cohort,
            headers=auth_headers,
        )
        if load_resp.status_code != 200:
            results["cohort_stats"][cohort]["fail"] += 1
            return
        dataset_id = load_resp.json()["dataset_id"]

        # Step 4: Run authenticated chat query with quota enforcement
        await record_request(
            client,
            "POST",
            f"{BASE_URL}/api/chat",
            cohort,
            json={"dataset_id": dataset_id, "message": "Give me revenue by region"},
            headers=auth_headers,
        )

        results["completed_users"] += 1
        results["cohort_stats"][cohort]["success"] += 1
    except Exception:
        results["failed_users"] += 1
        results["cohort_stats"][cohort]["fail"] += 1


# =====================================================================
# MAIN CONCURRENT SIMULATION RUNNER
# =====================================================================
async def run_simulation():
    print("=" * 70)
    print("🚀 STARTING 100 CONCURRENT USER SIMULATION — DATAPILOT AI")
    print(f"Target Base URL: {BASE_URL}")
    print("Concurrency: 100 simultaneous simulated user sessions")
    print("=" * 70)

    start_wall_time = time.perf_counter()

    # Semaphore to throttle concurrent connections gracefully
    sem = asyncio.Semaphore(25)

    async def worker(u_idx: int):
        async with sem:
            # Create a dedicated HTTP client for each user with unique simulated IP
            headers = {"X-Forwarded-For": f"198.51.100.{u_idx % 250 + 1}"}
            async with httpx.AsyncClient(timeout=30.0, headers=headers) as client:
                if 1 <= u_idx <= 30:
                    await simulate_financial_analyst(u_idx, client)
                elif 31 <= u_idx <= 55:
                    await simulate_data_engineer(u_idx, client)
                elif 56 <= u_idx <= 75:
                    await simulate_executive(u_idx, client)
                elif 76 <= u_idx <= 90:
                    await simulate_compliance_researcher(u_idx, client)
                else:
                    await simulate_saas_user(u_idx, client)

    tasks = [worker(i) for i in range(1, 101)]
    await asyncio.gather(*tasks, return_exceptions=True)

    total_time = time.perf_counter() - start_wall_time

    # Calculate latency percentiles
    lats = sorted(results["latencies"])
    p50 = lats[int(len(lats) * 0.50)] if lats else 0
    p90 = lats[int(len(lats) * 0.90)] if lats else 0
    p95 = lats[int(len(lats) * 0.95)] if lats else 0
    p99 = lats[int(len(lats) * 0.99)] if lats else 0
    avg_lat = sum(lats) / len(lats) if lats else 0

    print("\n" + "=" * 70)
    print("📊 100-USER SIMULATION COMPLETED")
    print("=" * 70)
    print(f"Total Simulation Wall Time : {total_time:.2f} seconds")
    print(f"Total Virtual Users        : {results['total_users']}")
    print(f"Successful User Journeys   : {results['completed_users']} / {results['total_users']} ({(results['completed_users']/results['total_users'])*100:.1f}%)")
    print(f"Failed User Journeys       : {results['failed_users']}")
    print(f"Total HTTP Requests        : {results['total_requests']}")
    print(f"Successful Requests (2xx)  : {results['successful_requests']}")
    print(f"Failed Requests            : {results['failed_requests']}")
    print(f"Throughput                 : {results['total_requests'] / total_time:.2f} req/sec")
    print("\n⏱️ LATENCY BENCHMARKS (ms):")
    print(f"  • Min Latency     : {min(lats):.2f} ms" if lats else "  • Min: N/A")
    print(f"  • Average Latency : {avg_lat:.2f} ms")
    print(f"  • Median (p50)    : {p50:.2f} ms")
    print(f"  • 90th %-ile (p90): {p90:.2f} ms")
    print(f"  • 95th %-ile (p95): {p95:.2f} ms")
    print(f"  • 99th %-ile (p99): {p99:.2f} ms")
    print(f"  • Max Latency     : {max(lats):.2f} ms" if lats else "  • Max: N/A")

    print("\n👥 BREAKDOWN BY USER COHORT:")
    for cohort_name, stats in results["cohort_stats"].items():
        print(f"  • {cohort_name:<30}: {stats['success']} completed | {stats['reqs']} requests")

    if results["errors"]:
        print("\n⚠️ SAMPLE ERRORS DETECTED:")
        for err in results["errors"][:5]:
            print(f"  - {err}")
    else:
        print("\n✅ Zero application or network errors detected across all 100 concurrent sessions!")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(run_simulation())
