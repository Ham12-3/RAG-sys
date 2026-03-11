from dataclasses import dataclass, field
from datetime import datetime, timezone


@dataclass
class Document:
    content: str
    source: str
    metadata: dict = field(default_factory=dict)


@dataclass
class Chunk:
    text: str
    source: str
    chunk_index: int
    metadata: dict = field(default_factory=dict)


@dataclass
class EmbeddedChunk:
    text: str
    source: str
    chunk_index: int
    embedding: list[float]
    metadata: dict = field(default_factory=dict)
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
