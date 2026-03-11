from fastapi import Request
from fastapi.responses import JSONResponse
import structlog

logger = structlog.get_logger()


class RAGError(Exception):
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class EmbeddingError(RAGError):
    def __init__(self, message: str = "Embedding generation failed"):
        super().__init__(message, status_code=502)


class VectorStoreError(RAGError):
    def __init__(self, message: str = "Vector store operation failed"):
        super().__init__(message, status_code=502)


class GenerationError(RAGError):
    def __init__(self, message: str = "LLM generation failed"):
        super().__init__(message, status_code=502)


class DocumentParsingError(RAGError):
    def __init__(self, message: str = "Failed to parse document"):
        super().__init__(message, status_code=400)


async def rag_error_handler(request: Request, exc: RAGError) -> JSONResponse:
    logger.error("rag_error", message=exc.message, status_code=exc.status_code, path=request.url.path)
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.message},
    )
