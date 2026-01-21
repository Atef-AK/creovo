"""AI module exports."""

from lensio.ai.prompt_engine import (
    BasePromptEngine,
    OpenAIPromptEngine,
    AnthropicPromptEngine,
    PromptTemplateEngine,
    AntiRepetitionEngine,
    PromptResult,
    get_prompt_engine,
    openai_engine,
    anthropic_engine,
    template_engine,
    anti_repetition_engine,
)
from lensio.ai.script_generation import (
    ScriptGenerationService,
    NicheConfig,
    script_service,
)
from lensio.ai.google_ai import (
    GoogleAIClient,
    GoogleModel,
    GenerationResult,
    WhiskService,
    FlowService,
    get_google_client,
    get_whisk_service,
    get_flow_service,
)

__all__ = [
    # Legacy engines (fallback)
    "BasePromptEngine",
    "OpenAIPromptEngine",
    "AnthropicPromptEngine",
    "PromptTemplateEngine",
    "AntiRepetitionEngine",
    "PromptResult",
    "get_prompt_engine",
    "openai_engine",
    "anthropic_engine",
    "template_engine",
    "anti_repetition_engine",
    "ScriptGenerationService",
    "NicheConfig",
    "script_service",
    # Google AI (primary)
    "GoogleAIClient",
    "GoogleModel",
    "GenerationResult",
    "WhiskService",
    "FlowService",
    "get_google_client",
    "get_whisk_service",
    "get_flow_service",
]
