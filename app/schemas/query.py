from pydantic import BaseModel, Field


class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    top_k: int = Field(default=5, ge=1, le=50)
    collection_name: str | None = None


class Citation(BaseModel):
    chunk_index: int
    source: str
    text: str
    relevance_score: float


class GroundingResult(BaseModel):
    grounding_score: float
    total_sentences: int
    grounded_sentences: int
    ungrounded_claims: list[str]


class LatencyBreakdown(BaseModel):
    embedding_ms: float
    retrieval_ms: float
    generation_ms: float
    hallucination_check_ms: float
    total_ms: float


class QueryResponse(BaseModel):
    answer: str
    citations: list[Citation]
    grounding: GroundingResult
    latency: LatencyBreakdown
