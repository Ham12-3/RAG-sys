from fastapi import Request

from app.services.chunking import ChunkingService
from app.services.embedding import EmbeddingService
from app.services.evaluation import EvaluationService
from app.services.generation import GenerationService
from app.services.hallucination import HallucinationDetector
from app.services.retrieval import RetrievalService
from app.services.vectorstore import VectorStoreService


def get_embedding_service(request: Request) -> EmbeddingService:
    return request.app.state.embedding_service


def get_chunking_service(request: Request) -> ChunkingService:
    return request.app.state.chunking_service


def get_vectorstore_service(request: Request) -> VectorStoreService:
    return request.app.state.vectorstore_service


def get_retrieval_service(request: Request) -> RetrievalService:
    return request.app.state.retrieval_service


def get_generation_service(request: Request) -> GenerationService:
    return request.app.state.generation_service


def get_hallucination_detector(request: Request) -> HallucinationDetector:
    return request.app.state.hallucination_detector


def get_evaluation_service(request: Request) -> EvaluationService:
    return request.app.state.evaluation_service
