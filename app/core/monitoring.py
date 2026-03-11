import time
from contextlib import contextmanager
from dataclasses import dataclass, field

import structlog

logger = structlog.get_logger()


@dataclass
class LatencyTracker:
    timings: dict[str, float] = field(default_factory=dict)

    @contextmanager
    def track(self, label: str):
        start = time.perf_counter()
        try:
            yield
        finally:
            elapsed_ms = (time.perf_counter() - start) * 1000
            self.timings[label] = elapsed_ms
            logger.info("latency_tracked", label=label, elapsed_ms=round(elapsed_ms, 2))

    @property
    def total_ms(self) -> float:
        return sum(self.timings.values())

    def as_dict(self) -> dict[str, float]:
        result = {k: round(v, 2) for k, v in self.timings.items()}
        result["total_ms"] = round(self.total_ms, 2)
        return result
