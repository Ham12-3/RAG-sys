from fastapi import APIRouter, Depends

from app.core.dependencies import (
    get_embedding_service,
    get_generation_service,
    get_hallucination_detector,
    get_retrieval_service,
)
from app.core.monitoring import LatencyTracker
from app.schemas.query import (
    Citation,
    GroundingResult,
    LatencyBreakdown,
    QueryRequest,
    QueryResponse,
)
from app.services.embedding import EmbeddingService
from app.services.generation import GenerationService
from app.services.hallucination import HallucinationDetector
from app.services.retrieval import RetrievalService

router = APIRouter()


@router.post("/query", response_model=QueryResponse)
async def query_documents(
    request: QueryRequest,
    retrieval: RetrievalService = Depends(get_retrieval_service),
    embedding: EmbeddingService = Depends(get_embedding_service),
    generation: GenerationService = Depends(get_generation_service),
    hallucination: HallucinationDetector = Depends(get_hallucination_detector),
):
    tracker = LatencyTracker()
    collection = request.collection_name or retrieval.settings.weaviate_collection_name

    # Embed query (tracked separately)
    with tracker.track("embedding_ms"):
        query_vector = await embedding.embed_query(request.query)

    # Retrieve from vector store
    with tracker.track("retrieval_ms"):
        results = await retrieval.vectorstore_service.search(
            query_vector=query_vector,
            collection_name=collection,
            top_k=request.top_k,
        )

    # Generate answer
    with tracker.track("generation_ms"):
        answer = await generation.generate(query=request.query, context_chunks=results)

    # Check hallucination / grounding
    with tracker.track("hallucination_check_ms"):
        grounding = await hallucination.check_grounding(answer=answer, retrieved_chunks=results)

    # Build citations
    citations = [
        Citation(
            chunk_index=i,
            source=r.get("source", ""),
            text=r.get("text", "")[:500],
            relevance_score=r.get("relevance_score", 0.0),
        )
        for i, r in enumerate(results)
    ]

    timings = tracker.as_dict()
    return QueryResponse(
        answer=answer,
        citations=citations,
        grounding=GroundingResult(**grounding),
        latency=LatencyBreakdown(
            embedding_ms=timings.get("embedding_ms", 0),
            retrieval_ms=timings.get("retrieval_ms", 0),
            generation_ms=timings.get("generation_ms", 0),
            hallucination_check_ms=timings.get("hallucination_check_ms", 0),
            total_ms=timings.get("total_ms", 0),
        ),
    )
