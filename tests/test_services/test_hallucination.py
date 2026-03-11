from unittest.mock import AsyncMock, MagicMock

import pytest

from app.config import Settings, EmbeddingProvider
from app.services.embedding import EmbeddingService
from app.services.hallucination import HallucinationDetector


@pytest.fixture
def settings():
    return Settings(
        embedding_provider=EmbeddingProvider.SENTENCE_TRANSFORMERS,
        grounding_similarity_threshold=0.7,
        log_format="console",
    )


@pytest.fixture
def mock_embed():
    svc = MagicMock(spec=EmbeddingService)
    # Return embeddings for 1 answer sentence + 1 chunk
    svc.embed_texts = AsyncMock(return_value=[[0.1] * 384, [0.1] * 384])
    svc.cosine_similarity = MagicMock(return_value=0.85)
    return svc


@pytest.mark.asyncio
async def test_grounded_answer(settings, mock_embed):
    detector = HallucinationDetector(settings, mock_embed)
    result = await detector.check_grounding(
        answer="This is a grounded statement.",
        retrieved_chunks=[{"text": "This is similar context."}],
    )
    assert result["grounding_score"] > 0
    assert result["grounded_sentences"] == 1
    assert result["ungrounded_claims"] == []


@pytest.mark.asyncio
async def test_ungrounded_answer(settings, mock_embed):
    mock_embed.cosine_similarity.return_value = 0.3  # Below threshold
    detector = HallucinationDetector(settings, mock_embed)
    result = await detector.check_grounding(
        answer="This is an ungrounded claim.",
        retrieved_chunks=[{"text": "Unrelated context."}],
    )
    assert result["grounding_score"] == 0.0
    assert len(result["ungrounded_claims"]) == 1


@pytest.mark.asyncio
async def test_empty_answer(settings, mock_embed):
    detector = HallucinationDetector(settings, mock_embed)
    result = await detector.check_grounding(answer="", retrieved_chunks=[])
    assert result["grounding_score"] == 0.0
