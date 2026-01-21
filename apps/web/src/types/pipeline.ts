import { Timestamp } from './common';
import { JobStatus } from './job';

/**
 * Pipeline step definition
 */
export interface PipelineStep {
    id: string;
    name: string;
    status: JobStatus;
    order: number;

    // Dependencies
    dependsOn: string[];

    // Retry configuration
    maxRetries: number;
    retryDelayMs: number;

    // Timeout
    timeoutMs: number;

    // Cost weight (for estimation)
    costWeight: number;
}

/**
 * Pipeline step result
 */
export interface PipelineStepResult {
    stepId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

    // Timing
    startedAt?: Timestamp;
    completedAt?: Timestamp;
    durationMs?: number;

    // Result
    output?: unknown;
    error?: {
        code: string;
        message: string;
        stack?: string;
    };

    // Retries
    attempts: number;
}

/**
 * Full pipeline definition
 */
export const PIPELINE_STEPS: PipelineStep[] = [
    {
        id: 'idea_generation',
        name: 'Idea Generation',
        status: JobStatus.IDEA_GENERATION,
        order: 1,
        dependsOn: [],
        maxRetries: 3,
        retryDelayMs: 1000,
        timeoutMs: 30000,
        costWeight: 0.05,
    },
    {
        id: 'script_generation',
        name: 'Script Generation',
        status: JobStatus.SCRIPT_GENERATION,
        order: 2,
        dependsOn: ['idea_generation'],
        maxRetries: 3,
        retryDelayMs: 2000,
        timeoutMs: 60000,
        costWeight: 0.10,
    },
    {
        id: 'scene_breakdown',
        name: 'Scene Breakdown',
        status: JobStatus.SCENE_BREAKDOWN,
        order: 3,
        dependsOn: ['script_generation'],
        maxRetries: 2,
        retryDelayMs: 1000,
        timeoutMs: 30000,
        costWeight: 0.05,
    },
    {
        id: 'image_generation',
        name: 'Image Generation',
        status: JobStatus.IMAGE_GENERATION,
        order: 4,
        dependsOn: ['scene_breakdown'],
        maxRetries: 3,
        retryDelayMs: 5000,
        timeoutMs: 180000,
        costWeight: 0.25,
    },
    {
        id: 'video_generation',
        name: 'Video Generation',
        status: JobStatus.VIDEO_GENERATION,
        order: 5,
        dependsOn: ['image_generation'],
        maxRetries: 3,
        retryDelayMs: 10000,
        timeoutMs: 300000,
        costWeight: 0.30,
    },
    {
        id: 'audio_selection',
        name: 'Audio Selection',
        status: JobStatus.AUDIO_SELECTION,
        order: 6,
        dependsOn: ['script_generation'],
        maxRetries: 2,
        retryDelayMs: 2000,
        timeoutMs: 30000,
        costWeight: 0.05,
    },
    {
        id: 'text_overlay',
        name: 'Text Overlay',
        status: JobStatus.TEXT_OVERLAY,
        order: 7,
        dependsOn: ['video_generation'],
        maxRetries: 2,
        retryDelayMs: 2000,
        timeoutMs: 60000,
        costWeight: 0.05,
    },
    {
        id: 'video_assembly',
        name: 'Video Assembly',
        status: JobStatus.VIDEO_ASSEMBLY,
        order: 8,
        dependsOn: ['text_overlay', 'audio_selection'],
        maxRetries: 2,
        retryDelayMs: 5000,
        timeoutMs: 120000,
        costWeight: 0.10,
    },
    {
        id: 'platform_formatting',
        name: 'Platform Formatting',
        status: JobStatus.PLATFORM_FORMATTING,
        order: 9,
        dependsOn: ['video_assembly'],
        maxRetries: 2,
        retryDelayMs: 2000,
        timeoutMs: 60000,
        costWeight: 0.05,
    },
];

/**
 * Pipeline execution context
 */
export interface PipelineContext {
    jobId: string;
    userId: string;
    nicheId: string;
    platform: string;

    // Current state
    currentStep: string;
    completedSteps: string[];

    // Results from each step
    stepResults: Record<string, PipelineStepResult>;

    // Accumulated data
    data: Record<string, unknown>;

    // Timing
    startedAt: Timestamp;
    lastUpdateAt: Timestamp;
}

/**
 * Worker task message
 */
export interface WorkerTask {
    taskId: string;
    jobId: string;
    stepId: string;

    // Payload
    input: Record<string, unknown>;
    context: Partial<PipelineContext>;

    // Priority
    priority: number;

    // Timing
    createdAt: Timestamp;
    expiresAt: Timestamp;

    // Retry info
    attempt: number;
    maxAttempts: number;
}

/**
 * Worker task result
 */
export interface WorkerTaskResult {
    taskId: string;
    success: boolean;

    // Output
    output?: Record<string, unknown>;
    error?: {
        code: string;
        message: string;
        retryable: boolean;
    };

    // Metrics
    durationMs: number;
    cost: number;

    // Next step
    nextStep?: string;
}
