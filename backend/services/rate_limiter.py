import time
from collections import defaultdict
from typing import Dict, List
from fastapi import HTTPException, Request, status
from backend.core.config import get_settings

settings = get_settings()


class InMemoryRateLimiter:
    """Sliding window rate limiter per client IP."""

    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.client_records: Dict[str, List[float]] = defaultdict(list)

    def is_rate_limited(self, client_id: str) -> bool:
        now = time.time()
        window_start = now - 60.0

        # Filter out timestamps older than the 1-minute window
        timestamps = [ts for ts in self.client_records[client_id] if ts > window_start]
        self.client_records[client_id] = timestamps

        if len(timestamps) >= self.requests_per_minute:
            return True

        self.client_records[client_id].append(now)
        return False


rate_limiter = InMemoryRateLimiter(requests_per_minute=settings.RATE_LIMIT_REQUESTS_PER_MINUTE)


async def check_rate_limit(request: Request):
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
    else:
        client_ip = request.client.host if request.client else "unknown"

    if rate_limiter.is_rate_limited(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded: max {rate_limiter.requests_per_minute} requests per minute.",
        )
