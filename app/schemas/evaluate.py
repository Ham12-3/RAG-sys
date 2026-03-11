from pydantic import BaseModel, Field


class EvalQueryItem(BaseModel):
    query: str
    relevant_doc_ids: list[str]


class EvalRequest(BaseModel):
    queries: list[EvalQueryItem] = Field(..., min_length=1)
    top_k: int = Field(default=5, ge=1, le=50)
    collection_name: str | None = None


class PerQueryMetrics(BaseModel):
    query: str
    recall_at_k: float
    reciprocal_rank: float
    ndcg: float


class EvalResponse(BaseModel):
    per_query: list[PerQueryMetrics]
    aggregate_recall_at_k: float
    aggregate_mrr: float
    aggregate_ndcg: float
    total_queries: int
    top_k: int
