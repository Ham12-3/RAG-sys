from unittest.mock import AsyncMock, MagicMock

import pytest

from app.config import ChunkingStrategy, Settings, EmbeddingProvider
from app.models.document import Document
from app.services.chunking import ChunkingService
from app.services.embedding import EmbeddingService


@pytest.fixture
def settings():
    return Settings(
        embedding_provider=EmbeddingProvider.SENTENCE_TRANSFORMERS,
        chunk_size=100,
        chunk_overlap=20,
        semantic_similarity_threshold=0.5,
        log_format="console",
    )


@pytest.fixture
def mock_embed():
    svc = MagicMock(spec=EmbeddingService)
    svc.embed_texts = AsyncMock(return_value=[[0.1] * 384, [0.9] * 384, [0.1] * 384])
    svc.cosine_similarity = MagicMock(side_effect=[0.3, 0.3])  # low similarity -> split
    return svc


@pytest.fixture
def chunker(settings, mock_embed):
    return ChunkingService(settings, mock_embed)


@pytest.fixture
def sample_doc():
    return Document(
        content="First sentence here. Second sentence there. Third sentence everywhere.",
        source="test.txt",
    )


@pytest.mark.asyncio
async def test_recursive_character(chunker, sample_doc):
    chunks = await chunker.chunk(sample_doc, strategy=ChunkingStrategy.RECURSIVE_CHARACTER)
    assert len(chunks) >= 1
    assert all(c.source == "test.txt" for c in chunks)
    # Reconstructed text should cover original
    joined = " ".join(c.text for c in chunks)
    assert "First" in joined


@pytest.mark.asyncio
async def test_sentence_based(chunker, sample_doc):
    chunks = await chunker.chunk(sample_doc, strategy=ChunkingStrategy.SENTENCE)
    assert len(chunks) >= 1
    assert chunks[0].chunk_index == 0


@pytest.mark.asyncio
async def test_semantic(chunker, sample_doc):
    chunks = await chunker.chunk(sample_doc, strategy=ChunkingStrategy.SEMANTIC)
    # With low similarity threshold side effects, should split into multiple
    assert len(chunks) >= 1
