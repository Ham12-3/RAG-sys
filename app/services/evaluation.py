import math

import structlog

from app.services.retrieval import RetrievalService

logger = structlog.get_logger()


class EvaluationService:
    def __init__(self, retrieval_service: RetrievalService):
        self.retrieval_service = retrieval_service

    async def evaluate(
        self,
        queries: list[dict],
        top_k: int = 5,
        collection_name: str | None = None,
    ) -> dict:
        """
        Evaluate retrieval quality.
        queries: list of {"query": str, "relevant_doc_ids": list[str]}
        """
        per_query: list[dict] = []

        for item in queries:
            query = item["query"]
            relevant_ids = set(item["relevant_doc_ids"])

            results, _ = await self.retrieval_service.retrieve(
                query=query,
                collection_name=collection_name,
                top_k=top_k,
            )

            retrieved_ids = [r.get("document_id", "") for r in results]
            recall = self._recall_at_k(retrieved_ids, relevant_ids, top_k)
            rr = self._reciprocal_rank(retrieved_ids, relevant_ids)
            ndcg = self._ndcg(retrieved_ids, relevant_ids, top_k)

            per_query.append({
                "query": query,
                "recall_at_k": round(recall, 4),
                "reciprocal_rank": round(rr, 4),
                "ndcg": round(ndcg, 4),
            })

        n = len(per_query)
        agg_recall = sum(q["recall_at_k"] for q in per_query) / n if n else 0
        agg_mrr = sum(q["reciprocal_rank"] for q in per_query) / n if n else 0
        agg_ndcg = sum(q["ndcg"] for q in per_query) / n if n else 0

        logger.info(
            "evaluation_complete",
            total_queries=n,
            recall=round(agg_recall, 4),
            mrr=round(agg_mrr, 4),
            ndcg=round(agg_ndcg, 4),
        )

        return {
            "per_query": per_query,
            "aggregate_recall_at_k": round(agg_recall, 4),
            "aggregate_mrr": round(agg_mrr, 4),
            "aggregate_ndcg": round(agg_ndcg, 4),
            "total_queries": n,
            "top_k": top_k,
        }

    def _recall_at_k(
        self, retrieved_ids: list[str], relevant_ids: set[str], k: int
    ) -> float:
        if not relevant_ids:
            return 0.0
        retrieved_set = set(retrieved_ids[:k])
        return len(retrieved_set & relevant_ids) / len(relevant_ids)

    def _reciprocal_rank(
        self, retrieved_ids: list[str], relevant_ids: set[str]
    ) -> float:
        for i, doc_id in enumerate(retrieved_ids):
            if doc_id in relevant_ids:
                return 1.0 / (i + 1)
        return 0.0

    def _ndcg(
        self, retrieved_ids: list[str], relevant_ids: set[str], k: int
    ) -> float:
        # DCG: sum of 1/log2(i+2) for relevant docs at position i
        dcg = 0.0
        for i, doc_id in enumerate(retrieved_ids[:k]):
            if doc_id in relevant_ids:
                dcg += 1.0 / math.log2(i + 2)

        # Ideal DCG: all relevant docs ranked first
        ideal_count = min(len(relevant_ids), k)
        idcg = sum(1.0 / math.log2(i + 2) for i in range(ideal_count))

        if idcg == 0:
            return 0.0
        return dcg / idcg
