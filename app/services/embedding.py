import asyncio

import numpy as np
import structlog
from openai import AsyncOpenAI

from app.config import EmbeddingProvider, Settings
from app.core.exceptions import EmbeddingError

logger = structlog.get_logger()


class EmbeddingService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.provider = settings.embedding_provider
        self._openai_client: AsyncOpenAI | None = None
        self._st_model = None

    async def initialize(self):
        if self.provider == EmbeddingProvider.OPENAI:
            if not self.settings.openai_api_key:
                logger.warning("no_openai_key", msg="Falling back to sentence-transformers")
                self.provider = EmbeddingProvider.SENTENCE_TRANSFORMERS
            else:
                self._openai_client = AsyncOpenAI(api_key=self.settings.openai_api_key)

        if self.provider == EmbeddingProvider.SENTENCE_TRANSFORMERS:
            await self._load_st_model()

    async def _load_st_model(self):
        def _load():
            from sentence_transformers import SentenceTransformer
            return SentenceTransformer(self.settings.fallback_embedding_model)

        self._st_model = await asyncio.to_thread(_load)
        logger.info("st_model_loaded", model=self.settings.fallback_embedding_model)

    @property
    def dimension(self) -> int:
        if self.provider == EmbeddingProvider.OPENAI:
            return 1536
        return 384

    @property
    def provider_name(self) -> str:
        return self.provider.value

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []

        try:
            if self.provider == EmbeddingProvider.OPENAI:
                return await self._embed_openai(texts)
            return await self._embed_st(texts)
        except EmbeddingError:
            raise
        except Exception as e:
            # Fallback to sentence-transformers if OpenAI fails
            if self.provider == EmbeddingProvider.OPENAI:
                logger.warning("openai_embed_failed", error=str(e), msg="Falling back to ST")
                if self._st_model is None:
                    await self._load_st_model()
                self.provider = EmbeddingProvider.SENTENCE_TRANSFORMERS
                return await self._embed_st(texts)
            raise EmbeddingError(f"Embedding failed: {e}") from e

    async def embed_query(self, query: str) -> list[float]:
        results = await self.embed_texts([query])
        return results[0]

    async def _embed_openai(self, texts: list[str]) -> list[list[float]]:
        assert self._openai_client is not None
        batch_size = 100
        all_embeddings: list[list[float]] = []

        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            response = await self._openai_client.embeddings.create(
                model=self.settings.openai_embedding_model,
                input=batch,
            )
            all_embeddings.extend([item.embedding for item in response.data])

        return all_embeddings

    async def _embed_st(self, texts: list[str]) -> list[list[float]]:
        if self._st_model is None:
            raise EmbeddingError("Sentence-transformers model not loaded")

        def _encode():
            embeddings = self._st_model.encode(texts, show_progress_bar=False)
            return embeddings.tolist() if isinstance(embeddings, np.ndarray) else embeddings

        return await asyncio.to_thread(_encode)

    def cosine_similarity(self, vec_a: list[float], vec_b: list[float]) -> float:
        a = np.array(vec_a)
        b = np.array(vec_b)
        dot = np.dot(a, b)
        norm = np.linalg.norm(a) * np.linalg.norm(b)
        if norm == 0:
            return 0.0
        return float(dot / norm)
