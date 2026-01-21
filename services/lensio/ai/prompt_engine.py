"""
AI Prompt Engine

Core intellectual property for generating high-quality, non-repetitive content.
"""

import hashlib
import json
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any

import openai
import anthropic
from tenacity import retry, stop_after_attempt, wait_exponential

from lensio.core import settings


@dataclass
class PromptResult:
    """Result from prompt execution."""
    success: bool
    output: Any | None = None
    raw_response: str | None = None
    usage: dict[str, int] | None = None
    cost: float = 0.0
    latency_ms: float = 0.0
    error: str | None = None
    model: str = ""
    request_id: str = ""


class BasePromptEngine(ABC):
    """Abstract base class for AI prompt engines."""

    @abstractmethod
    async def execute(
        self,
        system_prompt: str,
        user_prompt: str,
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        output_schema: dict[str, Any] | None = None,
    ) -> PromptResult:
        """Execute a prompt and return the result."""
        pass


class OpenAIPromptEngine(BasePromptEngine):
    """OpenAI GPT-4 prompt engine."""

    def __init__(self) -> None:
        self.client = openai.AsyncOpenAI(
            api_key=settings.openai_api_key.get_secret_value()
        )
        self.default_model = settings.openai_model

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
    )
    async def execute(
        self,
        system_prompt: str,
        user_prompt: str,
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        output_schema: dict[str, Any] | None = None,
    ) -> PromptResult:
        import time
        start_time = time.time()
        
        try:
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ]

            # Use JSON mode if schema provided
            response_format = None
            if output_schema:
                response_format = {"type": "json_object"}

            response = await self.client.chat.completions.create(
                model=model or self.default_model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                response_format=response_format,
            )

            latency_ms = (time.time() - start_time) * 1000
            content = response.choices[0].message.content or ""
            
            # Parse JSON if expected
            output = content
            if output_schema and content:
                try:
                    output = json.loads(content)
                except json.JSONDecodeError:
                    pass

            # Calculate cost (GPT-4o pricing)
            usage = response.usage
            cost = 0.0
            if usage:
                cost = (usage.prompt_tokens * 0.0025 / 1000) + (usage.completion_tokens * 0.01 / 1000)

            return PromptResult(
                success=True,
                output=output,
                raw_response=content,
                usage={
                    "prompt_tokens": usage.prompt_tokens if usage else 0,
                    "completion_tokens": usage.completion_tokens if usage else 0,
                    "total_tokens": usage.total_tokens if usage else 0,
                },
                cost=cost,
                latency_ms=latency_ms,
                model=model or self.default_model,
                request_id=response.id,
            )

        except Exception as e:
            latency_ms = (time.time() - start_time) * 1000
            return PromptResult(
                success=False,
                error=str(e),
                latency_ms=latency_ms,
                model=model or self.default_model,
            )


class AnthropicPromptEngine(BasePromptEngine):
    """Anthropic Claude prompt engine."""

    def __init__(self) -> None:
        self.client = anthropic.AsyncAnthropic(
            api_key=settings.anthropic_api_key.get_secret_value()
        )
        self.default_model = settings.anthropic_model

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
    )
    async def execute(
        self,
        system_prompt: str,
        user_prompt: str,
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        output_schema: dict[str, Any] | None = None,
    ) -> PromptResult:
        import time
        start_time = time.time()

        try:
            # Add JSON instruction if schema provided
            if output_schema:
                user_prompt += "\n\nRespond with valid JSON only."

            response = await self.client.messages.create(
                model=model or self.default_model,
                max_tokens=max_tokens,
                system=system_prompt,
                messages=[{"role": "user", "content": user_prompt}],
            )

            latency_ms = (time.time() - start_time) * 1000
            content = response.content[0].text if response.content else ""

            # Parse JSON if expected
            output = content
            if output_schema and content:
                try:
                    output = json.loads(content)
                except json.JSONDecodeError:
                    pass

            # Calculate cost (Claude 3.5 Sonnet pricing)
            cost = (response.usage.input_tokens * 0.003 / 1000) + (response.usage.output_tokens * 0.015 / 1000)

            return PromptResult(
                success=True,
                output=output,
                raw_response=content,
                usage={
                    "prompt_tokens": response.usage.input_tokens,
                    "completion_tokens": response.usage.output_tokens,
                    "total_tokens": response.usage.input_tokens + response.usage.output_tokens,
                },
                cost=cost,
                latency_ms=latency_ms,
                model=model or self.default_model,
                request_id=response.id,
            )

        except Exception as e:
            latency_ms = (time.time() - start_time) * 1000
            return PromptResult(
                success=False,
                error=str(e),
                latency_ms=latency_ms,
                model=model or self.default_model,
            )


class PromptTemplateEngine:
    """Template engine for prompt variable substitution."""

    @staticmethod
    def render(template: str, variables: dict[str, Any]) -> str:
        """Render template with variables using {{variable}} syntax."""
        result = template
        for key, value in variables.items():
            placeholder = "{{" + key + "}}"
            if isinstance(value, (list, dict)):
                value = json.dumps(value)
            result = result.replace(placeholder, str(value))
        return result


class AntiRepetitionEngine:
    """Engine to prevent content repetition using semantic similarity."""

    def __init__(self) -> None:
        self.history_cache: dict[str, list[str]] = {}

    def get_content_hash(self, content: str) -> str:
        """Generate hash for content fingerprinting."""
        return hashlib.md5(content.lower().encode()).hexdigest()

    def is_too_similar(
        self,
        new_content: str,
        history: list[str],
        threshold: float = 0.85,
    ) -> bool:
        """Check if new content is too similar to history."""
        # Simple word overlap similarity for MVP
        # TODO: Use embeddings for production
        new_words = set(new_content.lower().split())
        
        for past_content in history[-20:]:  # Check last 20 items
            past_words = set(past_content.lower().split())
            if not new_words or not past_words:
                continue
            
            intersection = len(new_words & past_words)
            union = len(new_words | past_words)
            similarity = intersection / union if union > 0 else 0
            
            if similarity > threshold:
                return True
        
        return False

    def record_content(self, user_id: str, content: str) -> None:
        """Record content in history for user."""
        if user_id not in self.history_cache:
            self.history_cache[user_id] = []
        self.history_cache[user_id].append(content)
        
        # Keep only last 100 items
        if len(self.history_cache[user_id]) > 100:
            self.history_cache[user_id] = self.history_cache[user_id][-100:]


# Factory function
def get_prompt_engine(provider: str = "openai") -> BasePromptEngine:
    """Get prompt engine by provider name."""
    engines = {
        "openai": OpenAIPromptEngine,
        "anthropic": AnthropicPromptEngine,
    }
    engine_class = engines.get(provider, OpenAIPromptEngine)
    return engine_class()


# Singleton instances
openai_engine = OpenAIPromptEngine()
anthropic_engine = AnthropicPromptEngine()
template_engine = PromptTemplateEngine()
anti_repetition_engine = AntiRepetitionEngine()
