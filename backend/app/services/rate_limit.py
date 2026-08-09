"""Small in-process rate limiter; use a platform WAF for multi-instance deployments."""

from __future__ import annotations

from collections import defaultdict, deque
from time import monotonic


class RateLimiter:
    def __init__(self, limit: int, window_seconds: float = 60) -> None:
        self.limit = limit
        self.window_seconds = window_seconds
        self._requests: dict[str, deque[float]] = defaultdict(deque)

    def allow(self, key: str) -> bool:
        now = monotonic()
        entries = self._requests[key]
        while entries and now - entries[0] >= self.window_seconds:
            entries.popleft()
        if len(entries) >= self.limit:
            return False
        entries.append(now)
        return True
