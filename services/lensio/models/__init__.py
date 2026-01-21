"""
Pydantic Models for API Request/Response

Type-safe models matching the TypeScript types from @lensio/types.
"""

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


# Enums
class UserRole(str, Enum):
    FREE = "free"
    STARTER = "starter"
    PRO = "pro"
    AGENCY = "agency"
    ADMIN = "admin"


class UserStatus(str, Enum):
    PENDING_VERIFICATION = "pending_verification"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    DELETED = "deleted"


class JobStatus(str, Enum):
    PENDING = "pending"
    QUEUED = "queued"
    PROCESSING = "processing"
    IDEA_GENERATION = "idea_generation"
    SCRIPT_GENERATION = "script_generation"
    SCENE_BREAKDOWN = "scene_breakdown"
    IMAGE_GENERATION = "image_generation"
    VIDEO_GENERATION = "video_generation"
    AUDIO_SELECTION = "audio_selection"
    TEXT_OVERLAY = "text_overlay"
    VIDEO_ASSEMBLY = "video_assembly"
    PLATFORM_FORMATTING = "platform_formatting"
    EXPORTING = "exporting"
    COMPLETED = "completed"
    PARTIAL = "partial"
    FAILED = "failed"
    CANCELLED = "cancelled"


class JobPriority(int, Enum):
    LOW = 0
    NORMAL = 5
    HIGH = 10
    URGENT = 15


class Platform(str, Enum):
    TIKTOK = "tiktok"
    YOUTUBE_SHORTS = "youtube_shorts"
    INSTAGRAM_REELS = "instagram_reels"
    INSTAGRAM_STORIES = "instagram_stories"


class NicheCategory(str, Enum):
    LIFESTYLE = "lifestyle"
    BUSINESS = "business"
    EDUCATION = "education"
    ENTERTAINMENT = "entertainment"
    HEALTH = "health"
    TECHNOLOGY = "technology"
    FINANCE = "finance"
    SPORTS = "sports"
    FOOD = "food"
    TRAVEL = "travel"


# Base Models
class TimestampMixin(BaseModel):
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# User Models
class UserBase(BaseModel):
    email: str
    display_name: str | None = None
    role: UserRole = UserRole.FREE
    status: UserStatus = UserStatus.PENDING_VERIFICATION


class User(UserBase, TimestampMixin):
    id: str
    email_verified: bool = False
    credits: int = 5
    lifetime_credits: int = 5


# Job Models
class Scene(BaseModel):
    scene_number: int
    duration: float
    narration: str
    visual_description: str
    text_overlay: str | None = None
    transition: str = "fade"
    image_prompt: str | None = None
    image_url: str | None = None
    video_prompt: str | None = None
    video_url: str | None = None
    status: str = "pending"
    error: str | None = None


class GeneratedIdea(BaseModel):
    topic: str
    hook: str
    angle: str
    summary: str
    target_emotion: str
    key_message: str
    visual_style: str


class GeneratedScript(BaseModel):
    title: str
    hook: str
    scenes: list[Scene]
    call_to_action: str
    total_duration: float
    estimated_word_count: int


class CostBreakdown(BaseModel):
    script_generation: float = 0.0
    image_prompts: float = 0.0
    image_generation: float = 0.0
    video_generation: float = 0.0
    audio_selection: float = 0.0
    video_assembly: float = 0.0
    storage: float = 0.0
    total: float = 0.0


class JobOptions(BaseModel):
    resolution: str = "1080p"
    duration: int | None = None
    custom_topic: str | None = None
    exclude_topics: list[str] = Field(default_factory=list)
    visual_style: str | None = None


class JobCreate(BaseModel):
    niche_id: str
    platform: Platform
    options: JobOptions = Field(default_factory=JobOptions)


class JobResponse(TimestampMixin):
    id: str
    user_id: str
    niche_id: str
    platform: Platform
    status: JobStatus
    current_step: int = 0
    total_steps: int = 11
    progress: int = 0
    priority: JobPriority = JobPriority.NORMAL
    options: JobOptions
    idea: GeneratedIdea | None = None
    script: GeneratedScript | None = None
    scenes: list[Scene] = Field(default_factory=list)
    estimated_cost: CostBreakdown = Field(default_factory=CostBreakdown)
    actual_cost: CostBreakdown = Field(default_factory=CostBreakdown)
    credits_charged: int = 0
    credits_refunded: int = 0
    retry_count: int = 0
    max_retries: int = 3
    is_preview: bool = False


class JobStatusResponse(BaseModel):
    job_id: str
    status: JobStatus
    progress: dict[str, Any]
    scenes: list[dict[str, Any]] | None = None
    estimated_time_remaining: int | None = None
    credits_charged: int


# Credit Models
class CreditBalance(BaseModel):
    available: int
    pending: int
    period_start: datetime
    period_end: datetime
    period_grant: int
    period_used: int


class CreditEstimate(BaseModel):
    breakdown: CostBreakdown
    total_credits: int
    total_usd: float
    user_credits: int
    can_afford: bool
    credits_needed: int


# API Response Wrapper
class ApiResponse(BaseModel):
    success: bool
    data: Any | None = None
    error: dict[str, Any] | None = None
    meta: dict[str, Any] | None = None


# Niche Models
class NichePlatformConfig(BaseModel):
    enabled: bool = True
    duration: dict[str, int] = Field(default_factory=lambda: {"min": 15, "max": 60})
    aspect_ratio: str = "9:16"
    hashtag_strategy: str = "mixed"
    max_hashtags: int = 5
    caption_style: str = "overlay"


class PromptTemplate(BaseModel):
    id: str
    version: int = 1
    system_prompt: str
    user_prompt_template: str
    output_schema: dict[str, Any] | None = None
    temperature: float = 0.7
    max_tokens: int = 2000
    model: str = "gpt-4o"


class NicheResponse(TimestampMixin):
    id: str
    slug: str
    name: str
    version: int
    description: str
    category: NicheCategory
    content_style: str
    target_audience: list[str]
    platforms: dict[str, NichePlatformConfig]
    estimated_credit_cost: int = 3
    average_duration: int = 30
    is_active: bool = True
    is_premium: bool = False
    tags: list[str] = Field(default_factory=list)
