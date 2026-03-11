from fastapi import APIRouter

from app.api import evaluate, health, ingest, query

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(ingest.router, tags=["ingest"])
api_router.include_router(query.router, tags=["query"])
api_router.include_router(evaluate.router, tags=["evaluate"])
