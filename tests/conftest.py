from contextlib import asynccontextmanager
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.config import Settings, EmbeddingProvider
from app.api.router import api_router
from app.core.exceptions import RAGError, rag_error_handler
from app.services.chunking import ChunkingService
from app.services.embedding import EmbeddingService
from app.services.evaluation import EvaluationService
from app.services.generation import GenerationService
from app.services.hallucination import HallucinationDetector
from app.services.retrieval import RetrievalService
from app.services.vectorstore import VectorStoreService


@pytest.fixture
def test_settings():
    return Settings(
        openai_api_key="test-key",
        embedding_provider=EmbeddingProvider.SENTENCE_TRANSFORMERS,
        weaviate_url="http://localhost:8080",
        weaviate_grpc_url="localhost:50051",
        log_format="console",
    )


@pytest.fixture
def mock_embedding_service(test_settings):
    service = MagicMock(spec=EmbeddingService)
    service.settings = test_settings
    service.provider_name = "sentence-transformers"
    service.dimension = 384
    service.embed_texts = AsyncMock(return_value=[[0.1] * 384])
    service.embed_query = AsyncMock(return_value=[0.1] * 384)
    service.cosine_similarity = MagicMock(return_value=0.85)
    return service


@pytest.fixture
def mock_vectorstore_service(test_settings):
    service = MagicMock(spec=VectorStoreService)
    service.settings = test_settings
    service.is_healthy = MagicMock(return_value=True)
    service.ensure_collection = AsyncMock()
    service.upsert_chunks = AsyncMock(return_value=3)
    service.search = AsyncMock(return_value=[
        {
            "text": "Test chunk content",
            "source": "test.txt",
            "chunk_index": 0,
            "document_id": "doc-1",
            "relevance_score": 0.95,
        }
    ])
    return service


@pytest.fixture
def mock_generation_service():
    service = MagicMock(spec=GenerationService)
    service.generate = AsyncMock(return_value="This is the answer based on [0].")
    return service


@pytest.fixture
def mock_hallucination_detector():
    service = MagicMock(spec=HallucinationDetector)
    service.check_grounding = AsyncMock(return_value={
        "grounding_score": 0.9,
        "total_sentences": 1,
        "grounded_sentences": 1,
        "ungrounded_claims": [],
    })
    return service


@pytest.fixture
def mock_retrieval_service(mock_embedding_service, mock_vectorstore_service, test_settings):
    service = RetrievalService(test_settings, mock_embedding_service, mock_vectorstore_service)
    return service


@pytest.fixture
def mock_evaluation_service(mock_retrieval_service):
    return EvaluationService(mock_retrieval_service)


@pytest.fixture
def client(
    test_settings,
    mock_embedding_service,
    mock_vectorstore_service,
    mock_generation_service,
    mock_hallucination_detector,
    mock_retrieval_service,
    mock_evaluation_service,
):
    @asynccontextmanager
    async def noop_lifespan(app: FastAPI):
        yield

    app = FastAPI(lifespan=noop_lifespan)
    app.add_exception_handler(RAGError, rag_error_handler)
    app.include_router(api_router)

    # Set state directly (no real Weaviate connection)
    app.state.embedding_service = mock_embedding_service
    app.state.chunking_service = ChunkingService(test_settings, mock_embedding_service)
    app.state.vectorstore_service = mock_vectorstore_service
    app.state.retrieval_service = mock_retrieval_service
    app.state.generation_service = mock_generation_service
    app.state.hallucination_detector = mock_hallucination_detector
    app.state.evaluation_service = mock_evaluation_service

    with TestClient(app, raise_server_exceptions=False) as tc:
        yield tc
