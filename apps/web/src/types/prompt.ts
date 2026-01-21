import { Timestamp } from './common';

/**
 * AI model providers
 */
export enum AIProvider {
    OPENAI = 'openai',
    ANTHROPIC = 'anthropic',
    REPLICATE = 'replicate',
    RUNWAY = 'runway',
    FAL = 'fal',
    ELEVENLABS = 'elevenlabs',
}

/**
 * AI model types
 */
export enum AIModelType {
    TEXT = 'text',
    IMAGE = 'image',
    VIDEO = 'video',
    AUDIO = 'audio',
    EMBEDDING = 'embedding',
}

/**
 * Available AI models
 */
export interface AIModel {
    id: string;
    provider: AIProvider;
    type: AIModelType;
    name: string;
    version: string;

    // Pricing (per unit)
    costPerUnit: number;
    unitType: 'token' | 'image' | 'second' | 'character';

    // Limits
    maxInputTokens?: number;
    maxOutputTokens?: number;
    maxDuration?: number;

    // Capabilities
    capabilities: string[];

    // Status
    isActive: boolean;
    isDefault: boolean;
}

/**
 * Prompt template version
 */
export interface PromptVersion {
    id: string;
    templateId: string;
    version: number;

    // Content
    systemPrompt: string;
    userPromptTemplate: string;
    outputSchema?: Record<string, unknown>;

    // Model settings
    model: string;
    temperature: number;
    maxTokens: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;

    // Metadata
    description: string;
    changelog: string;

    // Status
    isActive: boolean;
    isDefault: boolean;

    // Audit
    createdAt: Timestamp;
    createdBy: string;
}

/**
 * Prompt execution request
 */
export interface PromptExecutionRequest {
    templateId: string;
    version?: number;

    // Variables to inject
    variables: Record<string, unknown>;

    // Override settings
    overrides?: {
        model?: string;
        temperature?: number;
        maxTokens?: number;
    };

    // Context
    userId: string;
    jobId?: string;
}

/**
 * Prompt execution result
 */
export interface PromptExecutionResult {
    success: boolean;

    // Response
    output?: unknown;
    rawResponse?: string;

    // Usage
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };

    // Cost
    cost: number;

    // Performance
    latencyMs: number;

    // Error
    error?: {
        code: string;
        message: string;
        retryable: boolean;
    };

    // Metadata
    model: string;
    provider: string;
    requestId: string;
    executedAt: Timestamp;
}

/**
 * Prompt analytics
 */
export interface PromptAnalytics {
    templateId: string;
    version: number;

    // Usage
    executionCount: number;
    successRate: number;

    // Performance
    avgLatencyMs: number;
    p95LatencyMs: number;

    // Cost
    totalCost: number;
    avgCostPerExecution: number;

    // Tokens
    avgPromptTokens: number;
    avgCompletionTokens: number;

    // Period
    periodStart: Timestamp;
    periodEnd: Timestamp;
}
