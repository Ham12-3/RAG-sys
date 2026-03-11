import structlog

from app.config import Settings
from app.services.embedding import EmbeddingService
from app.services.vectorstore import VectorStoreService

logger = structlog.get_logger()


class RetrievalService:
    def __init__(
        self,
        settings: Settings,
        embedding_service: EmbeddingService,
        vectorstore_service: VectorStoreService,
    ):
        self.settings = settings
        self.embedding_service = embedding_service
        self.vectorstore_service = vectorstore_service

    async def retrieve(
        self,
        query: str,
        collection_name: str | None = None,
        top_k: int | None = None,
    ) -> tuple[list[dict], list[float]]:
        """Returns (search_results, query_embedding) for downstream use."""
        collection = collection_name or self.settings.weaviate_collection_name
        k = top_k or self.settings.retrieval_top_k

        query_embedding = await self.embedding_service.embed_query(query)
        results = await self.vectorstore_service.search(
            query_vector=query_embedding,
            collection_name=collection,
            top_k=k,
        )

        logger.info("retrieval_complete", query_len=len(query), results=len(results), top_k=k)
        return results, query_embedding
