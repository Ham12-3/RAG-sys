import uuid

import structlog
import weaviate
from weaviate.classes.config import Configure, DataType, Property
from weaviate.classes.query import MetadataQuery

from app.config import Settings
from app.core.exceptions import VectorStoreError
from app.models.document import EmbeddedChunk

logger = structlog.get_logger()


class VectorStoreService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._client: weaviate.WeaviateClient | None = None

    async def connect(self):
        try:
            self._client = weaviate.connect_to_custom(
                http_host=self.settings.weaviate_url.replace("http://", "").split(":")[0],
                http_port=int(self.settings.weaviate_url.split(":")[-1]),
                http_secure=self.settings.weaviate_url.startswith("https"),
                grpc_host=self.settings.weaviate_grpc_url.split(":")[0],
                grpc_port=int(self.settings.weaviate_grpc_url.split(":")[-1]),
                grpc_secure=False,
            )
            logger.info("weaviate_connected", url=self.settings.weaviate_url)
        except Exception as e:
            raise VectorStoreError(f"Failed to connect to Weaviate: {e}") from e

    async def close(self):
        if self._client:
            self._client.close()

    @property
    def client(self) -> weaviate.WeaviateClient:
        if self._client is None:
            raise VectorStoreError("Weaviate client not connected")
        return self._client

    def is_healthy(self) -> bool:
        try:
            return self.client.is_ready()
        except Exception:
            return False

    async def ensure_collection(self, collection_name: str, dimension: int):
        try:
            if not self.client.collections.exists(collection_name):
                self.client.collections.create(
                    name=collection_name,
                    vectorizer_config=Configure.Vectorizer.none(),
                    properties=[
                        Property(name="text", data_type=DataType.TEXT),
                        Property(name="source", data_type=DataType.TEXT),
                        Property(name="chunk_index", data_type=DataType.INT),
                        Property(name="document_id", data_type=DataType.TEXT),
                        Property(name="created_at", data_type=DataType.TEXT),
                    ],
                )
                logger.info("collection_created", name=collection_name, dimension=dimension)
        except Exception as e:
            raise VectorStoreError(f"Failed to ensure collection: {e}") from e

    async def upsert_chunks(
        self,
        chunks: list[EmbeddedChunk],
        collection_name: str,
        document_id: str,
    ) -> int:
        try:
            collection = self.client.collections.get(collection_name)
            with collection.batch.dynamic() as batch:
                for chunk in chunks:
                    batch.add_object(
                        properties={
                            "text": chunk.text,
                            "source": chunk.source,
                            "chunk_index": chunk.chunk_index,
                            "document_id": document_id,
                            "created_at": chunk.created_at,
                        },
                        vector=chunk.embedding,
                        uuid=uuid.uuid5(uuid.NAMESPACE_DNS, f"{document_id}:{chunk.chunk_index}"),
                    )
            logger.info("chunks_upserted", count=len(chunks), collection=collection_name)
            return len(chunks)
        except Exception as e:
            raise VectorStoreError(f"Failed to upsert chunks: {e}") from e

    async def search(
        self,
        query_vector: list[float],
        collection_name: str,
        top_k: int = 5,
    ) -> list[dict]:
        try:
            collection = self.client.collections.get(collection_name)
            results = collection.query.near_vector(
                near_vector=query_vector,
                limit=top_k,
                return_metadata=MetadataQuery(distance=True),
            )

            hits: list[dict] = []
            for obj in results.objects:
                score = 1.0 - (obj.metadata.distance or 0.0)
                hits.append({
                    "text": obj.properties.get("text", ""),
                    "source": obj.properties.get("source", ""),
                    "chunk_index": obj.properties.get("chunk_index", 0),
                    "document_id": obj.properties.get("document_id", ""),
                    "relevance_score": round(score, 4),
                })

            return hits
        except Exception as e:
            raise VectorStoreError(f"Search failed: {e}") from e
