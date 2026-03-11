import structlog
from openai import AsyncOpenAI

from app.config import Settings
from app.core.exceptions import GenerationError

logger = structlog.get_logger()

SYSTEM_PROMPT = """You are a helpful assistant that answers questions based on the provided context.

Rules:
- Only use information from the provided context chunks to answer.
- Cite your sources by referencing chunk indices like [0], [1], etc.
- If the context doesn't contain enough information to answer, say so explicitly.
- Be concise and accurate."""


class GenerationService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._client: AsyncOpenAI | None = None

    async def initialize(self):
        if self.settings.openai_api_key:
            self._client = AsyncOpenAI(api_key=self.settings.openai_api_key)

    async def generate(self, query: str, context_chunks: list[dict]) -> str:
        if not self._client:
            raise GenerationError("OpenAI client not configured (missing API key)")

        context = self._format_context(context_chunks)
        user_message = f"Context:\n{context}\n\nQuestion: {query}"

        try:
            response = await self._client.chat.completions.create(
                model=self.settings.openai_chat_model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_message},
                ],
                temperature=0.1,
                max_tokens=1024,
            )
            answer = response.choices[0].message.content or ""
            logger.info("generation_complete", model=self.settings.openai_chat_model, answer_len=len(answer))
            return answer
        except Exception as e:
            raise GenerationError(f"LLM generation failed: {e}") from e

    def _format_context(self, chunks: list[dict]) -> str:
        parts: list[str] = []
        for i, chunk in enumerate(chunks):
            source = chunk.get("source", "unknown")
            text = chunk.get("text", "")
            parts.append(f"[{i}] (source: {source})\n{text}")
        return "\n\n".join(parts)
