from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.config import settings
from app.core.exceptions import RAGError, rag_error_handler
from app.services.chunking import ChunkingService
from app.services.embedding import EmbeddingService
from app.services.evaluation import EvaluationService
from app.services.generation import GenerationService
from app.services.hallucination import HallucinationDetector
from app.services.retrieval import RetrievalService
from app.services.vectorstore import VectorStoreService

logger = structlog.get_logger()


def configure_logging():
    processors = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
    ]

    if settings.log_format == "json":
        processors.append(structlog.processors.JSONRenderer())
    else:
        processors.append(structlog.dev.ConsoleRenderer())

    from structlog._log_levels import NAME_TO_LEVEL

    log_level = NAME_TO_LEVEL.get(settings.log_level.lower(), 20)
    structlog.configure(
        processors=processors,
        wrapper_class=structlog.make_filtering_bound_logger(log_level),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    logger.info("starting_rag_system", embedding_provider=settings.embedding_provider.value)

    # Initialize services
    embedding_service = EmbeddingService(settings)
    await embedding_service.initialize()

    vectorstore_service = VectorStoreService(settings)
    await vectorstore_service.connect()

    generation_service = GenerationService(settings)
    await generation_service.initialize()

    chunking_service = ChunkingService(settings, embedding_service)
    retrieval_service = RetrievalService(settings, embedding_service, vectorstore_service)
    hallucination_detector = HallucinationDetector(settings, embedding_service)
    evaluation_service = EvaluationService(retrieval_service)

    # Store on app state for dependency injection
    app.state.embedding_service = embedding_service
    app.state.chunking_service = chunking_service
    app.state.vectorstore_service = vectorstore_service
    app.state.retrieval_service = retrieval_service
    app.state.generation_service = generation_service
    app.state.hallucination_detector = hallucination_detector
    app.state.evaluation_service = evaluation_service

    logger.info("rag_system_ready")
    yield

    # Shutdown
    await vectorstore_service.close()
    logger.info("rag_system_shutdown")


def create_app() -> FastAPI:
    app = FastAPI(
        title="RAG System",
        description="Production-grade Retrieval-Augmented Generation system",
        version="0.1.0",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://frontend:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_exception_handler(RAGError, rag_error_handler)
    app.include_router(api_router)
    return app
