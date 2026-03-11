import nltk
import structlog

from app.config import Settings
from app.services.embedding import EmbeddingService

logger = structlog.get_logger()

try:
    nltk.data.find("tokenizers/punkt_tab")
except LookupError:
    nltk.download("punkt_tab", quiet=True)


class HallucinationDetector:
    def __init__(self, settings: Settings, embedding_service: EmbeddingService):
        self.settings = settings
        self.embedding_service = embedding_service
        self.threshold = settings.grounding_similarity_threshold

    async def check_grounding(
        self, answer: str, retrieved_chunks: list[dict]
    ) -> dict:
        """
        Compare each sentence in the answer against retrieved chunks.
        Returns grounding report with score and ungrounded claims.
        """
        sentences = nltk.sent_tokenize(answer)
        if not sentences or not retrieved_chunks:
            return {
                "grounding_score": 0.0,
                "total_sentences": len(sentences),
                "grounded_sentences": 0,
                "ungrounded_claims": sentences,
            }

        chunk_texts = [c.get("text", "") for c in retrieved_chunks]

        # Embed all sentences and chunks together for efficiency
        all_texts = sentences + chunk_texts
        all_embeddings = await self.embedding_service.embed_texts(all_texts)

        sentence_embeddings = all_embeddings[: len(sentences)]
        chunk_embeddings = all_embeddings[len(sentences) :]

        grounded_count = 0
        ungrounded_claims: list[str] = []

        for i, sent_emb in enumerate(sentence_embeddings):
            max_sim = max(
                self.embedding_service.cosine_similarity(sent_emb, chunk_emb)
                for chunk_emb in chunk_embeddings
            )
            if max_sim >= self.threshold:
                grounded_count += 1
            else:
                ungrounded_claims.append(sentences[i])

        total = len(sentences)
        grounding_score = grounded_count / total if total > 0 else 0.0

        logger.info(
            "grounding_check_complete",
            total_sentences=total,
            grounded=grounded_count,
            score=round(grounding_score, 3),
        )

        return {
            "grounding_score": round(grounding_score, 4),
            "total_sentences": total,
            "grounded_sentences": grounded_count,
            "ungrounded_claims": ungrounded_claims,
        }
