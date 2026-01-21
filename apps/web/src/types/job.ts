import { AuditMetadata, Timestamp } from './common';

/**
 * Job status enumeration - granular pipeline tracking
 */
export enum JobStatus {
    // Initial states
    PENDING = 'pending',
    QUEUED = 'queued',

    // Processing states
    PROCESSING = 'processing',
    IDEA_GENERATION = 'idea_generation',
    SCRIPT_GENERATION = 'script_generation',
    SCENE_BREAKDOWN = 'scene_breakdown',
    IMAGE_GENERATION = 'image_generation',
    VIDEO_GENERATION = 'video_generation',
    AUDIO_SELECTION = 'audio_selection',
    TEXT_OVERLAY = 'text_overlay',
    VIDEO_ASSEMBLY = 'video_assembly',
    PLATFORM_FORMATTING = 'platform_formatting',
    EXPORTING = 'exporting',

    // Final states
    COMPLETED = 'completed',
    PARTIAL = 'partial',
    FAILED = 'failed',
    CANCELLED = 'cancelled',
}

/**
 * Job priority levels
 */
export enum JobPriority {
    LOW = 0,
    NORMAL = 5,
    HIGH = 10,
    URGENT = 15,
}

/**
 * Scene data structure
 */
export interface Scene {
    sceneNumber: number;
    duration: number;
    narration: string;
    visualDescription: string;
    textOverlay?: string;
    transition: string;

    // Generated assets
    imagePrompt?: string;
    imageUrl?: string;
    videoPrompt?: string;
    videoUrl?: string;

    // Status
    status: 'pending' | 'processing' | 'completed' | 'failed';
    error?: string;
}

/**
 * Generated idea from AI
 */
export interface GeneratedIdea {
    topic: string;
    hook: string;
    angle: string;
    summary: string;
    targetEmotion: string;
    keyMessage: string;
    visualStyle: string;
}

/**
 * Generated script from AI
 */
export interface GeneratedScript {
    title: string;
    hook: string;
    scenes: Scene[];
    callToAction: string;
    totalDuration: number;
    estimatedWordCount: number;
}

/**
 * Audio/music selection
 */
export interface AudioSelection {
    trackId: string;
    trackName: string;
    mood: string;
    duration: number;
    url: string;
    attribution?: string;
    volume: number;
}

/**
 * Generated captions and hashtags
 */
export interface GeneratedCaptions {
    primaryCaption: string;
    alternativeCaptions: string[];
    hashtags: string[];
    callToAction: string;
    platform: string;
}

/**
 * Final rendered output
 */
export interface RenderOutput {
    videoUrl: string;
    thumbnailUrl: string;
    duration: number;
    resolution: string;
    fileSize: number;
    format: string;
    codec: string;
}

/**
 * Export result
 */
export interface ExportResult {
    provider: 'google_drive' | 'local' | 's3';
    fileId: string;
    fileUrl: string;
    folderUrl?: string;
    metadataFileId?: string;
    captionsFileId?: string;
    exportedAt: Timestamp;
}

/**
 * Cost breakdown for a job
 */
export interface JobCostBreakdown {
    scriptGeneration: number;
    imagePrompts: number;
    imageGeneration: number;
    videoGeneration: number;
    audioSelection: number;
    videoAssembly: number;
    storage: number;
    total: number;
}

/**
 * Checkpoint for job recovery
 */
export interface JobCheckpoint {
    step: JobStatus;
    data: Record<string, unknown>;
    completedAt: Timestamp;
}

/**
 * Job error details
 */
export interface JobError {
    step: JobStatus;
    code: string;
    message: string;
    recoverable: boolean;
    retryCount: number;
    occurredAt: Timestamp;
    stack?: string;
}

/**
 * Main job document
 */
export interface Job extends AuditMetadata {
    id: string;
    userId: string;
    nicheId: string;
    platform: string;

    // Status tracking
    status: JobStatus;
    currentStep: number;
    totalSteps: number;
    progress: number; // 0-100
    priority: JobPriority;

    // Configuration
    options: {
        resolution: '720p' | '1080p' | '4k';
        duration?: number;
        customTopic?: string;
        excludeTopics?: string[];
        visualStyle?: string;
    };

    // Generated content
    idea?: GeneratedIdea;
    script?: GeneratedScript;
    scenes: Scene[];
    audio?: AudioSelection;
    captions?: GeneratedCaptions;

    // Output
    render?: RenderOutput;
    export?: ExportResult;

    // Cost tracking
    estimatedCost: JobCostBreakdown;
    actualCost: JobCostBreakdown;
    creditsCharged: number;
    creditsRefunded: number;

    // Timing
    queuedAt?: Timestamp;
    startedAt?: Timestamp;
    completedAt?: Timestamp;
    estimatedCompletionAt?: Timestamp;

    // Recovery
    checkpoints: JobCheckpoint[];
    retryCount: number;
    maxRetries: number;

    // Errors
    errors: JobError[];

    // Metadata
    isPreview: boolean;
    parentJobId?: string; // For retries/regenerations
    tags: string[];
}

/**
 * Job queue item for workers
 */
export interface JobQueueItem {
    jobId: string;
    userId: string;
    priority: JobPriority;
    step: JobStatus;
    payload: Record<string, unknown>;
    createdAt: Timestamp;
    expiresAt: Timestamp;
    attempts: number;
}
