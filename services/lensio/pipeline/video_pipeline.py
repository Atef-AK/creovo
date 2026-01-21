"""
Video Generation Pipeline

Orchestrates the complete video generation workflow.
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
from lensio.ai import script_service, NicheConfig


class PipelineStep(Enum):
    """Pipeline execution steps."""
    IDEA_GENERATION = "idea_generation"
    SCRIPT_GENERATION = "script_generation"
    SCENE_BREAKDOWN = "scene_breakdown"
    IMAGE_GENERATION = "image_generation"
    VIDEO_GENERATION = "video_generation"
    AUDIO_SELECTION = "audio_selection"
    TEXT_OVERLAY = "text_overlay"
    VIDEO_ASSEMBLY = "video_assembly"
    PLATFORM_FORMATTING = "platform_formatting"
    EXPORT = "export"


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
    audio_url: str | None = None
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


class VideoPipeline:
    """Orchestrates video generation pipeline."""
    
    def __init__(self) -> None:
        self.step_handlers: dict[PipelineStep, Callable[[PipelineContext], Awaitable[StepResult]]] = {
            PipelineStep.IDEA_GENERATION: self._generate_idea,
            PipelineStep.SCRIPT_GENERATION: self._generate_script,
            PipelineStep.SCENE_BREAKDOWN: self._breakdown_scenes,
            PipelineStep.IMAGE_GENERATION: self._generate_images,
            PipelineStep.VIDEO_GENERATION: self._generate_videos,
            PipelineStep.AUDIO_SELECTION: self._select_audio,
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
                break  # Export is handled separately
            
            context.current_step = step
            
            # Report progress
            if on_progress:
                progress = int((i / total_steps) * 100)
                await on_progress(step, progress)
            
            # Execute step
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
                    # Continue for now, mark partial later
                
                # Accumulate cost
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
        """Generate video idea."""
        duration = ctx.options.get("duration", 30)
        exclude = ctx.options.get("exclude_topics", [])
        
        idea, result = await script_service.generate_idea(
            niche=ctx.niche,
            platform=ctx.platform,
            duration=duration,
            user_id=ctx.user_id,
            exclude_topics=exclude,
        )
        
        if idea:
            ctx.idea = idea
            return StepResult(success=True, data=idea, cost=result.cost)
        
        return StepResult(success=False, error=result.error, cost=result.cost)
    
    async def _generate_script(self, ctx: PipelineContext) -> StepResult:
        """Generate video script."""
        if not ctx.idea:
            return StepResult(success=False, error="No idea available")
        
        duration = ctx.options.get("duration", 30)
        
        script, result = await script_service.generate_script(
            idea=ctx.idea,
            platform=ctx.platform,
            duration=duration,
        )
        
        if script:
            ctx.script = script
            ctx.scenes = script.scenes
            return StepResult(success=True, data=script, cost=result.cost)
        
        return StepResult(success=False, error=result.error, cost=result.cost)
    
    async def _breakdown_scenes(self, ctx: PipelineContext) -> StepResult:
        """Break down script into detailed scenes."""
        # Scenes are already created during script generation
        # This step validates and enriches scene data
        if not ctx.scenes:
            return StepResult(success=False, error="No scenes available")
        
        return StepResult(success=True, data=ctx.scenes)
    
    async def _generate_images(self, ctx: PipelineContext) -> StepResult:
        """Generate images for each scene."""
        # TODO: Integrate with image generation API (Replicate/FAL)
        # For MVP, this is a placeholder
        
        for scene in ctx.scenes:
            scene.image_prompt = f"Cinematic {ctx.idea.visual_style} scene: {scene.visual_description}"
            scene.status = "pending"  # Would be "completed" after generation
        
        return StepResult(success=True, data=ctx.scenes, cost=0.04 * len(ctx.scenes))
    
    async def _generate_videos(self, ctx: PipelineContext) -> StepResult:
        """Generate video clips from images."""
        # TODO: Integrate with video generation API (Runway)
        # For MVP, this is a placeholder
        
        for scene in ctx.scenes:
            scene.video_prompt = f"Smooth motion: {scene.visual_description}"
            scene.status = "pending"
        
        return StepResult(success=True, data=ctx.scenes, cost=0.10 * len(ctx.scenes))
    
    async def _select_audio(self, ctx: PipelineContext) -> StepResult:
        """Select background audio/music."""
        # TODO: Integrate with audio API
        # For MVP, this is a placeholder
        
        ctx.audio_url = "placeholder_audio_url"
        return StepResult(success=True, data=ctx.audio_url, cost=0.01)
    
    async def _add_text_overlays(self, ctx: PipelineContext) -> StepResult:
        """Add text overlays to videos."""
        # TODO: Process text overlays with FFmpeg
        # For MVP, this is a placeholder
        
        return StepResult(success=True, data=ctx.scenes, cost=0.005)
    
    async def _assemble_video(self, ctx: PipelineContext) -> StepResult:
        """Assemble final video from scenes."""
        # TODO: Combine scenes into final video using FFmpeg
        # For MVP, this is a placeholder
        
        ctx.final_video_url = f"videos/{ctx.job_id}/final.mp4"
        return StepResult(success=True, data=ctx.final_video_url, cost=0.01)
    
    async def _format_for_platform(self, ctx: PipelineContext) -> StepResult:
        """Format video for target platform."""
        # TODO: Apply platform-specific formatting
        # For MVP, this is a placeholder
        
        return StepResult(success=True, data=ctx.final_video_url, cost=0.005)


# Factory function
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
video_pipeline = VideoPipeline()
