import nltk
import structlog
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.config import ChunkingStrategy, Settings
from app.models.document import Chunk, Document
from app.services.embedding import EmbeddingService

logger = structlog.get_logger()

# Ensure punkt tokenizer is available
try:
    nltk.data.find("tokenizers/punkt_tab")
except LookupError:
    nltk.download("punkt_tab", quiet=True)


class ChunkingService:
    def __init__(self, settings: Settings, embedding_service: EmbeddingService):
        self.settings = settings
        self.embedding_service = embedding_service

    async def chunk(
        self,
        document: Document,
        strategy: ChunkingStrategy | None = None,
        chunk_size: int | None = None,
        chunk_overlap: int | None = None,
    ) -> list[Chunk]:
        strategy = strategy or self.settings.chunking_strategy
        chunk_size = chunk_size or self.settings.chunk_size
        chunk_overlap = chunk_overlap or self.settings.chunk_overlap

        logger.info(
            "chunking_document",
            source=document.source,
            strategy=strategy.value,
            chunk_size=chunk_size,
        )

        if strategy == ChunkingStrategy.RECURSIVE_CHARACTER:
            return self._recursive_character(document, chunk_size, chunk_overlap)
        elif strategy == ChunkingStrategy.SENTENCE:
            return self._sentence_based(document, chunk_size, chunk_overlap)
        elif strategy == ChunkingStrategy.SEMANTIC:
            return await self._semantic(document)
        else:
            raise ValueError(f"Unknown chunking strategy: {strategy}")

    def _recursive_character(
        self, document: Document, chunk_size: int, chunk_overlap: int
    ) -> list[Chunk]:
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""],
        )
        texts = splitter.split_text(document.content)
        return [
            Chunk(text=t, source=document.source, chunk_index=i, metadata=document.metadata)
            for i, t in enumerate(texts)
        ]

    def _sentence_based(
        self, document: Document, chunk_size: int, chunk_overlap: int
    ) -> list[Chunk]:
        sentences = nltk.sent_tokenize(document.content)
        chunks: list[Chunk] = []
        current_chunk: list[str] = []
        current_length = 0

        for sentence in sentences:
            sent_len = len(sentence)
            if current_length + sent_len > chunk_size and current_chunk:
                chunks.append(
                    Chunk(
                        text=" ".join(current_chunk),
                        source=document.source,
                        chunk_index=len(chunks),
                        metadata=document.metadata,
                    )
                )
                # Keep overlap by retaining trailing sentences
                overlap_text = " ".join(current_chunk)
                while len(overlap_text) > chunk_overlap and current_chunk:
                    current_chunk.pop(0)
                    overlap_text = " ".join(current_chunk)
                current_length = len(overlap_text)
            current_chunk.append(sentence)
            current_length += sent_len

        if current_chunk:
            chunks.append(
                Chunk(
                    text=" ".join(current_chunk),
                    source=document.source,
                    chunk_index=len(chunks),
                    metadata=document.metadata,
                )
            )

        return chunks

    async def _semantic(self, document: Document) -> list[Chunk]:
        import numpy as np

        sentences = nltk.sent_tokenize(document.content)
        if len(sentences) <= 1:
            return [
                Chunk(text=document.content, source=document.source, chunk_index=0, metadata=document.metadata)
            ]

        embeddings = await self.embedding_service.embed_texts(sentences)

        # Compute cosine similarities between consecutive sentences
        similarities: list[float] = []
        for i in range(len(embeddings) - 1):
            sim = self.embedding_service.cosine_similarity(embeddings[i], embeddings[i + 1])
            similarities.append(sim)

        # Split at points where similarity drops below threshold
        threshold = self.settings.semantic_similarity_threshold
        chunks: list[Chunk] = []
        current_sentences: list[str] = [sentences[0]]

        for i, sim in enumerate(similarities):
            if sim < threshold:
                chunks.append(
                    Chunk(
                        text=" ".join(current_sentences),
                        source=document.source,
                        chunk_index=len(chunks),
                        metadata=document.metadata,
                    )
                )
                current_sentences = []
            current_sentences.append(sentences[i + 1])

        if current_sentences:
            chunks.append(
                Chunk(
                    text=" ".join(current_sentences),
                    source=document.source,
                    chunk_index=len(chunks),
                    metadata=document.metadata,
                )
            )

        logger.info("semantic_chunking_done", total_chunks=len(chunks), total_sentences=len(sentences))
        return chunks
