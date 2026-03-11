from pydantic import BaseModel, Field
from app.config import ChunkingStrategy


class IngestRequest(BaseModel):
    chunking_strategy: ChunkingStrategy = ChunkingStrategy.RECURSIVE_CHARACTER
    chunk_size: int = Field(default=512, ge=50, le=4096)
    chunk_overlap: int = Field(default=50, ge=0, le=500)


class ChunkInfo(BaseModel):
    chunk_index: int
    text_preview: str
    char_count: int


class IngestResponse(BaseModel):
    document_id: str
    source: str
    total_chunks: int
    chunks: list[ChunkInfo]
    embedding_provider: str
    processing_time_ms: float
