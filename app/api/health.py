from fastapi import APIRouter, Depends

from app.core.dependencies import get_vectorstore_service
from app.services.vectorstore import VectorStoreService

router = APIRouter()


@router.get("/health")
async def health_check(
    vectorstore: VectorStoreService = Depends(get_vectorstore_service),
):
    weaviate_ok = vectorstore.is_healthy()
    status = "healthy" if weaviate_ok else "degraded"

    return {
        "status": status,
        "services": {
            "api": True,
            "weaviate": weaviate_ok,
        },
    }
