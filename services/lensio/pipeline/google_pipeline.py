"""
Video Generation Pipeline (Google AI Version)

Orchestrates video generation using Google's AI services:
- Gemini for script generation
- Imagen 3 / Nano Banana for image generation
- Veo for video generation
- Gemini TTS for voice narration
"""

import asyncio
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Callable, Awaitable
import uuid

from lensio.models import (
    JobStatus,
    Platform,
    Scene,
    GeneratedIdea,
    GeneratedScript,
    CostBreakdown,
)
from lensio.ai.google_ai import (
    GoogleAIClient,
    GoogleModel,
    GenerationResult,
    get_google_client,
    get_flow_service,
)


class PipelineStep(Enum):
    """Pipeline execution steps."""
    IDEA_GENERATION = "idea_generation"
    SCRIPT_GENERATION = "script_generation"
    VOICE_GENERATION = "voice_generation"
    SCENE_BREAKDOWN = "scene_breakdown"
    IMAGE_GENERATION = "image_generation"
    VIDEO_GENERATION = "video_generation"
    TEXT_OVERLAY = "text_overlay"
    VIDEO_ASSEMBLY = "video_assembly"
    PLATFORM_FORMATTING = "platform_formatting"
    EXPORT = "export"


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


@dataclass
class PipelineContext:
    """Context passed through pipeline steps."""
    job_id: str
    user_id: str
    niche: NicheConfig
    platform: Platform
    options: dict[str, Any]
    
    # Results
    idea: GeneratedIdea | None = None
    script: GeneratedScript | None = None
    scenes: list[Scene] = field(default_factory=list)
    voice_audio: dict | None = None
    final_video_url: str | None = None
    
    # Tracking
    current_step: PipelineStep | None = None
    completed_steps: list[PipelineStep] = field(default_factory=list)
    cost: CostBreakdown = field(default_factory=CostBreakdown)
    errors: list[dict[str, Any]] = field(default_factory=list)
    
    # Timing
    started_at: datetime = field(default_factory=datetime.utcnow)
    step_timings: dict[str, float] = field(default_factory=dict)


@dataclass
class StepResult:
    """Result from a pipeline step."""
    success: bool
    data: Any = None
    error: str | None = None
    cost: float = 0.0
    duration_ms: float = 0.0


class GoogleVideoPipeline:
    """
    Video pipeline using Google AI services.
    
    Flow:
    1. Gemini generates idea
    2. Gemini generates script
    3. Gemini TTS generates voice narration
    4. Imagen 3 generates scene images
    5. Veo generates video clips from images
    6. Assembly with FFmpeg
    7. Platform formatting
    """
    
    def __init__(self) -> None:
        self.google_client = get_google_client()
        self.flow_service = get_flow_service()
        
        self.step_handlers: dict[PipelineStep, Callable[[PipelineContext], Awaitable[StepResult]]] = {
            PipelineStep.IDEA_GENERATION: self._generate_idea,
            PipelineStep.SCRIPT_GENERATION: self._generate_script,
            PipelineStep.VOICE_GENERATION: self._generate_voice,
            PipelineStep.SCENE_BREAKDOWN: self._breakdown_scenes,
            PipelineStep.IMAGE_GENERATION: self._generate_images,
            PipelineStep.VIDEO_GENERATION: self._generate_videos,
            PipelineStep.TEXT_OVERLAY: self._add_text_overlays,
            PipelineStep.VIDEO_ASSEMBLY: self._assemble_video,
            PipelineStep.PLATFORM_FORMATTING: self._format_for_platform,
        }
    
    async def execute(
        self,
        context: PipelineContext,
        on_progress: Callable[[PipelineStep, int], Awaitable[None]] | None = None,
    ) -> PipelineContext:
        """Execute the full pipeline."""
        steps = list(PipelineStep)
        total_steps = len(steps)
        
        for i, step in enumerate(steps):
            if step == PipelineStep.EXPORT:
                break
            
            context.current_step = step
            
            if on_progress:
                progress = int((i / total_steps) * 100)
                await on_progress(step, progress)
            
            handler = self.step_handlers.get(step)
            if not handler:
                continue
            
            try:
                import time
                start = time.time()
                result = await handler(context)
                duration = (time.time() - start) * 1000
                
                context.step_timings[step.value] = duration
                
                if not result.success:
                    context.errors.append({
                        "step": step.value,
                        "error": result.error,
                        "recoverable": True,
                    })
                
                context.cost.total += result.cost
                
            except Exception as e:
                context.errors.append({
                    "step": step.value,
                    "error": str(e),
                    "recoverable": False,
                })
                break
            
            context.completed_steps.append(step)
        
        return context
    
    async def _generate_idea(self, ctx: PipelineContext) -> StepResult:
        """Generate video idea using Gemini."""
        prompt = f"""Generate a viral video idea for {ctx.platform.value}.

Niche: {ctx.niche.name}
Style: {ctx.niche.content_style}
Target Audience: {', '.join(ctx.niche.target_audience)}
Available Topics: {', '.join(ctx.niche.topics[:5])}
Hook Styles: {', '.join(ctx.niche.hooks[:3])}

Requirements:
- The idea must be scroll-stopping and engaging
- Optimize for first 3 seconds hook
- Duration target: {ctx.options.get('duration', 30)} seconds

Respond with JSON:
{{
  "topic": "specific topic",
  "hook": "attention-grabbing opening",
  "angle": "unique perspective",
  "summary": "2-3 sentence description",
  "target_emotion": "primary emotion",
  "key_message": "main takeaway",
  "visual_style": "visual aesthetic"
}}"""
        
        result = await self.google_client.generate_text(
            prompt=prompt,
            system_prompt="You are an expert viral content strategist for short-form video.",
            model=GoogleModel.GEMINI_2_5_FLASH,
            temperature=0.8,
        )
        
        if result.success and result.data:
            import json
            try:
                data = json.loads(result.data) if isinstance(result.data, str) else result.data
                ctx.idea = GeneratedIdea(**data)
                return StepResult(success=True, data=ctx.idea, cost=result.cost)
            except Exception as e:
                return StepResult(success=False, error=f"Parse error: {e}", cost=result.cost)
        
        return StepResult(success=False, error=result.error, cost=result.cost)
    
    async def _generate_script(self, ctx: PipelineContext) -> StepResult:
        """Generate script using Gemini."""
        if not ctx.idea:
            return StepResult(success=False, error="No idea available")
        
        prompt = f"""Create a complete video script:

Topic: {ctx.idea.topic}
Hook: {ctx.idea.hook}
Visual Style: {ctx.idea.visual_style}
Platform: {ctx.platform.value}
Duration: {ctx.options.get('duration', 30)} seconds

Respond with JSON:
{{
  "title": "video title",
  "hook": "opening hook text",
  "scenes": [
    {{
      "scene_number": 1,
      "duration": 3.0,
      "narration": "voiceover text",
      "visual_description": "detailed visual",
      "text_overlay": "on-screen text or null",
      "transition": "fade/cut/zoom"
    }}
  ],
  "call_to_action": "ending CTA",
  "total_duration": 30,
  "estimated_word_count": 150
}}"""
        
        result = await self.google_client.generate_text(
            prompt=prompt,
            system_prompt="You are a master short-form video scriptwriter.",
            model=GoogleModel.GEMINI_2_5_FLASH,
            temperature=0.7,
            max_tokens=3000,
        )
        
        if result.success and result.data:
            import json
            try:
                data = json.loads(result.data) if isinstance(result.data, str) else result.data
                scenes = [Scene(**s) for s in data.get("scenes", [])]
                ctx.script = GeneratedScript(
                    title=data.get("title", ""),
                    hook=data.get("hook", ""),
                    scenes=scenes,
                    call_to_action=data.get("call_to_action", ""),
                    total_duration=float(data.get("total_duration", 30)),
                    estimated_word_count=int(data.get("estimated_word_count", 0)),
                )
                ctx.scenes = scenes
                return StepResult(success=True, data=ctx.script, cost=result.cost)
            except Exception as e:
                return StepResult(success=False, error=f"Parse error: {e}", cost=result.cost)
        
        return StepResult(success=False, error=result.error, cost=result.cost)
    
    async def _generate_voice(self, ctx: PipelineContext) -> StepResult:
        """Generate voice narration using Gemini TTS."""
        if not ctx.script:
            return StepResult(success=False, error="No script available")
        
        # Combine all scene narrations
        full_narration = " ".join([
            scene.narration for scene in ctx.scenes if scene.narration
        ])
        
        if not full_narration:
            return StepResult(success=True, data=None, cost=0)
        
        result = await self.google_client.generate_speech(
            text=full_narration,
            voice_description="A confident, engaging voice perfect for social media content",
            model=GoogleModel.GEMINI_TTS_FLASH,
        )
        
        if result.success:
            ctx.voice_audio = result.data
            return StepResult(success=True, data=result.data, cost=result.cost)
        
        return StepResult(success=False, error=result.error, cost=result.cost)
    
    async def _breakdown_scenes(self, ctx: PipelineContext) -> StepResult:
        """Validate and prepare scenes for generation."""
        if not ctx.scenes:
            return StepResult(success=False, error="No scenes available")
        
        # Ensure each scene has required data
        for i, scene in enumerate(ctx.scenes):
            if not scene.visual_description:
                scene.visual_description = f"Scene {i+1} visual for {ctx.idea.topic}"
            scene.status = "pending"
        
        return StepResult(success=True, data=ctx.scenes)
    
    async def _generate_images(self, ctx: PipelineContext) -> StepResult:
        """Generate images for each scene using Imagen 3."""
        total_cost = 0.0
        
        for scene in ctx.scenes:
            # Build image prompt
            prompt = f"""Cinematic {ctx.idea.visual_style} style.
{scene.visual_description}
Vertical 9:16 aspect ratio. 
High quality, professional video still.
Leave space for text overlay at {'bottom' if scene.text_overlay else 'center'}."""
            
            result = await self.google_client.generate_image(
                prompt=prompt,
                negative_prompt="blurry, low quality, watermark, text, letters, words",
                aspect_ratio="9:16",
                model=GoogleModel.IMAGEN_3,
            )
            
            if result.success and result.data:
                scene.status = "image_complete"
                # Store base64 image data
                if result.data and len(result.data) > 0:
                    scene.image_url = f"data:image/png;base64,{result.data[0]['base64'][:50]}..."
            else:
                scene.status = "failed"
                scene.error = result.error
            
            total_cost += result.cost
        
        return StepResult(success=True, data=ctx.scenes, cost=total_cost)
    
    async def _generate_videos(self, ctx: PipelineContext) -> StepResult:
        """Generate video clips using Google Veo."""
        total_cost = 0.0
        
        for scene in ctx.scenes:
            if scene.status != "image_complete":
                continue
            
            # Generate motion prompt
            prompt = f"""Smooth, cinematic motion.
{scene.visual_description}
Style: {ctx.idea.visual_style}
Camera movement: subtle, professional"""
            
            result = await self.google_client.generate_video(
                prompt=prompt,
                duration_seconds=min(int(scene.duration), 8),
                aspect_ratio="9:16",
                model=GoogleModel.VEO_2,
            )
            
            if result.success:
                scene.video_url = result.url
                scene.status = "video_complete"
            else:
                scene.status = "video_failed"
                scene.error = result.error
            
            total_cost += result.cost
        
        return StepResult(success=True, data=ctx.scenes, cost=total_cost)
    
    async def _add_text_overlays(self, ctx: PipelineContext) -> StepResult:
        """Add text overlays to videos (placeholder for FFmpeg processing)."""
        # TODO: Implement FFmpeg text overlay processing
        return StepResult(success=True, data=ctx.scenes, cost=0.005)
    
    async def _assemble_video(self, ctx: PipelineContext) -> StepResult:
        """Assemble final video from scenes (placeholder for FFmpeg)."""
        # TODO: Implement FFmpeg video assembly
        ctx.final_video_url = f"videos/{ctx.job_id}/final.mp4"
        return StepResult(success=True, data=ctx.final_video_url, cost=0.01)
    
    async def _format_for_platform(self, ctx: PipelineContext) -> StepResult:
        """Format video for target platform."""
        # TODO: Apply platform-specific formatting
        return StepResult(success=True, data=ctx.final_video_url, cost=0.005)


def create_pipeline_context(
    user_id: str,
    niche: NicheConfig,
    platform: Platform,
    options: dict[str, Any] | None = None,
) -> PipelineContext:
    """Create a new pipeline context."""
    return PipelineContext(
        job_id=str(uuid.uuid4()),
        user_id=user_id,
        niche=niche,
        platform=platform,
        options=options or {},
    )


# Singleton
google_video_pipeline = GoogleVideoPipeline()
