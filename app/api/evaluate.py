from fastapi import APIRouter, Depends

from app.core.dependencies import get_evaluation_service
from app.schemas.evaluate import EvalRequest, EvalResponse, PerQueryMetrics
from app.services.evaluation import EvaluationService

router = APIRouter()


@router.post("/evaluate", response_model=EvalResponse)
async def evaluate_retrieval(
    request: EvalRequest,
    evaluation: EvaluationService = Depends(get_evaluation_service),
):
    queries = [
        {"query": q.query, "relevant_doc_ids": q.relevant_doc_ids}
        for q in request.queries
    ]

    result = await evaluation.evaluate(
        queries=queries,
        top_k=request.top_k,
        collection_name=request.collection_name,
    )

    return EvalResponse(
        per_query=[PerQueryMetrics(**pq) for pq in result["per_query"]],
        aggregate_recall_at_k=result["aggregate_recall_at_k"],
        aggregate_mrr=result["aggregate_mrr"],
        aggregate_ndcg=result["aggregate_ndcg"],
        total_queries=result["total_queries"],
        top_k=result["top_k"],
    )
