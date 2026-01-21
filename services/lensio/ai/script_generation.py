"""
Script Generation Service

Generates viral short-form video scripts using AI.
"""

from dataclasses import dataclass
from typing import Any

from lensio.ai.prompt_engine import (
    get_prompt_engine,
    template_engine,
    anti_repetition_engine,
    PromptResult,
)
from lensio.models import Platform, GeneratedIdea, GeneratedScript, Scene


# Prompt Templates
IDEA_SYSTEM_PROMPT = """You are an expert viral content strategist specializing in short-form video content. 
You understand platform algorithms, audience psychology, and what makes content shareable.
Your ideas are fresh, engaging, and optimized for maximum retention."""

IDEA_USER_TEMPLATE = """Generate a viral video idea for the {{platform}} platform.

Niche: {{niche_name}}
Content Style: {{content_style}}
Target Audience: {{target_audience}}
Topic Pool: {{topics}}
Hook Styles: {{hooks}}
Visual Styles: {{visual_styles}}

Requirements:
- The idea must be unique and scroll-stopping
- Optimize for the first 3 seconds (hook)
- Consider platform-specific trends
- Duration target: {{duration}} seconds

Respond with valid JSON:
{
  "topic": "specific topic",
  "hook": "attention-grabbing opening line", 
  "angle": "unique perspective on the topic",
  "summary": "2-3 sentence description",
  "target_emotion": "primary emotion to evoke",
  "key_message": "main takeaway",
  "visual_style": "visual aesthetic"
}"""

SCRIPT_SYSTEM_PROMPT = """You are a master short-form video scriptwriter. Your scripts:
- Hook viewers in the first 2 seconds
- Maintain engagement through the entire video
- Use proven storytelling structures
- Are optimized for platform algorithms
- Drive action with clear CTAs"""

SCRIPT_USER_TEMPLATE = """Create a complete video script based on this idea:

Topic: {{topic}}
Hook: {{hook}}
Visual Style: {{visual_style}}
Platform: {{platform}}
Duration: {{duration}} seconds

Requirements:
- Strong opening hook (first 2-3 seconds)
- Clear narrative arc
- Optimal pacing for retention
- Natural text overlay opportunities
- Strong call-to-action

Respond with valid JSON:
{
  "title": "video title",
  "hook": "opening hook text",
  "scenes": [
    {
      "scene_number": 1,
      "duration": 3.0,
      "narration": "voiceover text",
      "visual_description": "detailed visual description",
      "text_overlay": "on-screen text or null",
      "transition": "fade/cut/zoom"
    }
  ],
  "call_to_action": "ending CTA",
  "total_duration": 30,
  "estimated_word_count": 150
}"""


@dataclass
class NicheConfig:
    """Configuration for a content niche."""
    id: str
    name: str
    content_style: str
    target_audience: list[str]
    topics: list[str]
    hooks: list[str]
    visual_styles: list[str]


class ScriptGenerationService:
    """Service for generating video scripts."""

    def __init__(self, provider: str = "openai"):
        self.engine = get_prompt_engine(provider)

    async def generate_idea(
        self,
        niche: NicheConfig,
        platform: Platform,
        duration: int = 30,
        user_id: str | None = None,
        exclude_topics: list[str] | None = None,
        max_attempts: int = 5,
    ) -> tuple[GeneratedIdea | None, PromptResult]:
        """Generate a unique video idea."""
        
        # Filter out excluded topics
        available_topics = [t for t in niche.topics if t not in (exclude_topics or [])]
        
        for attempt in range(max_attempts):
            # Prepare variables
            variables = {
                "platform": platform.value,
                "niche_name": niche.name,
                "content_style": niche.content_style,
                "target_audience": ", ".join(niche.target_audience),
                "topics": ", ".join(available_topics),
                "hooks": ", ".join(niche.hooks),
                "visual_styles": ", ".join(niche.visual_styles),
                "duration": duration,
            }
            
            # Render template
            user_prompt = template_engine.render(IDEA_USER_TEMPLATE, variables)
            
            # Execute prompt
            result = await self.engine.execute(
                system_prompt=IDEA_SYSTEM_PROMPT,
                user_prompt=user_prompt,
                temperature=0.8 + (attempt * 0.05),  # Increase creativity on retries
                max_tokens=500,
                output_schema={"type": "object"},
            )
            
            if not result.success or not result.output:
                continue
            
            # Parse result
            try:
                data = result.output if isinstance(result.output, dict) else {}
                idea = GeneratedIdea(
                    topic=data.get("topic", ""),
                    hook=data.get("hook", ""),
                    angle=data.get("angle", ""),
                    summary=data.get("summary", ""),
                    target_emotion=data.get("target_emotion", ""),
                    key_message=data.get("key_message", ""),
                    visual_style=data.get("visual_style", ""),
                )
                
                # Check for repetition
                if user_id and anti_repetition_engine.is_too_similar(
                    idea.summary,
                    anti_repetition_engine.history_cache.get(user_id, []),
                ):
                    continue  # Try again
                
                # Record for anti-repetition
                if user_id:
                    anti_repetition_engine.record_content(user_id, idea.summary)
                
                return idea, result
                
            except Exception:
                continue
        
        return None, result

    async def generate_script(
        self,
        idea: GeneratedIdea,
        platform: Platform,
        duration: int = 30,
    ) -> tuple[GeneratedScript | None, PromptResult]:
        """Generate a complete video script from an idea."""
        
        variables = {
            "topic": idea.topic,
            "hook": idea.hook,
            "visual_style": idea.visual_style,
            "platform": platform.value,
            "duration": duration,
        }
        
        user_prompt = template_engine.render(SCRIPT_USER_TEMPLATE, variables)
        
        result = await self.engine.execute(
            system_prompt=SCRIPT_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.7,
            max_tokens=2000,
            output_schema={"type": "object"},
        )
        
        if not result.success or not result.output:
            return None, result
        
        try:
            data = result.output if isinstance(result.output, dict) else {}
            
            scenes = [
                Scene(
                    scene_number=s.get("scene_number", i + 1),
                    duration=float(s.get("duration", 3.0)),
                    narration=s.get("narration", ""),
                    visual_description=s.get("visual_description", ""),
                    text_overlay=s.get("text_overlay"),
                    transition=s.get("transition", "cut"),
                )
                for i, s in enumerate(data.get("scenes", []))
            ]
            
            script = GeneratedScript(
                title=data.get("title", ""),
                hook=data.get("hook", ""),
                scenes=scenes,
                call_to_action=data.get("call_to_action", ""),
                total_duration=float(data.get("total_duration", sum(s.duration for s in scenes))),
                estimated_word_count=int(data.get("estimated_word_count", 0)),
            )
            
            return script, result
            
        except Exception:
            return None, result


# Singleton instance
script_service = ScriptGenerationService()
