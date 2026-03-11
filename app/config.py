from enum import Enum
from pydantic_settings import BaseSettings, SettingsConfigDict


class ChunkingStrategy(str, Enum):
    RECURSIVE_CHARACTER = "recursive_character"
    SENTENCE = "sentence"
    SEMANTIC = "semantic"


class EmbeddingProvider(str, Enum):
    OPENAI = "openai"
    SENTENCE_TRANSFORMERS = "sentence-transformers"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # OpenAI
    openai_api_key: str = ""
    openai_embedding_model: str = "text-embedding-3-small"
    openai_chat_model: str = "gpt-4o-mini"

    # Embedding
    embedding_provider: EmbeddingProvider = EmbeddingProvider.OPENAI
    fallback_embedding_model: str = "all-MiniLM-L6-v2"

    # Weaviate
    weaviate_url: str = "http://localhost:8080"
    weaviate_grpc_url: str = "localhost:50051"
    weaviate_collection_name: str = "documents"

    # Chunking
    chunking_strategy: ChunkingStrategy = ChunkingStrategy.RECURSIVE_CHARACTER
    chunk_size: int = 512
    chunk_overlap: int = 50
    semantic_similarity_threshold: float = 0.8

    # Retrieval
    retrieval_top_k: int = 5

    # Hallucination detection
    grounding_similarity_threshold: float = 0.7

    # Monitoring
    log_level: str = "INFO"
    log_format: str = "json"

    @property
    def embedding_dimension(self) -> int:
        if self.embedding_provider == EmbeddingProvider.OPENAI:
            return 1536
        return 384  # all-MiniLM-L6-v2


settings = Settings()
