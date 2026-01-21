import { AuditMetadata, Timestamp } from './common';

/**
 * Niche category enumeration
 */
export enum NicheCategory {
    LIFESTYLE = 'lifestyle',
    BUSINESS = 'business',
    EDUCATION = 'education',
    ENTERTAINMENT = 'entertainment',
    HEALTH = 'health',
    TECHNOLOGY = 'technology',
    FINANCE = 'finance',
    SPORTS = 'sports',
    FOOD = 'food',
    TRAVEL = 'travel',
}

/**
 * Content style for niches
 */
export type ContentStyle = 'educational' | 'entertainment' | 'inspirational' | 'promotional' | 'storytelling';

/**
 * Platform-specific configuration within a niche
 */
export interface NichePlatformConfig {
    enabled: boolean;
    duration: {
        min: number;
        max: number;
    };
    aspectRatio: '9:16' | '16:9' | '1:1';
    hashtagStrategy: 'trending' | 'niche' | 'mixed';
    maxHashtags: number;
    captionStyle: 'overlay' | 'bottom' | 'dynamic';
    textSafeZone: {
        top: number;
        bottom: number;
        left: number;
        right: number;
    };
}

/**
 * Prompt template for AI generation
 */
export interface PromptTemplate {
    id: string;
    version: number;
    systemPrompt: string;
    userPromptTemplate: string;
    outputSchema?: Record<string, unknown>;
    temperature: number;
    maxTokens: number;
    model: 'gpt-4o' | 'gpt-4o-mini' | 'claude-3.5-sonnet' | 'claude-3-haiku';
}

/**
 * Weighted randomization item
 */
export interface WeightedItem {
    value: string;
    weight: number;
    lastUsed?: Timestamp;
    usageCount: number;
}

/**
 * Niche randomization configuration
 */
export interface NicheRandomization {
    topics: WeightedItem[];
    hooks: WeightedItem[];
    callToActions: WeightedItem[];
    visualStyles: WeightedItem[];
    tones: WeightedItem[];
    musicMoods: WeightedItem[];
}

/**
 * Performance metrics for a niche
 */
export interface NichePerformanceMetrics {
    totalGenerations: number;
    completionRate: number;
    averageGenerationTime: number;
    averageCost: number;
    popularityScore: number;
    lastUpdated: Timestamp;
}

/**
 * Main niche document
 */
export interface Niche extends AuditMetadata {
    id: string;
    slug: string;
    name: string;
    version: number;

    // Content configuration
    description: string;
    category: NicheCategory;
    contentStyle: ContentStyle;
    targetAudience: string[];

    // Platform-specific configs
    platforms: {
        tiktok: NichePlatformConfig;
        youtube_shorts: NichePlatformConfig;
        instagram_reels: NichePlatformConfig;
        instagram_stories: NichePlatformConfig;
    };

    // Prompt templates
    prompts: {
        idea: PromptTemplate;
        script: PromptTemplate;
        imagePrompt: PromptTemplate;
        motionPrompt: PromptTemplate;
        caption: PromptTemplate;
    };

    // Randomization elements
    randomization: NicheRandomization;

    // Anti-repetition settings
    antiRepetition: {
        minTopicGap: number; // Minimum generations before reusing a topic
        minHookGap: number;
        similarityThreshold: number; // 0-1, reject if similarity > threshold
    };

    // Metadata
    estimatedCreditCost: number;
    averageDuration: number;
    difficulty: 'easy' | 'medium' | 'hard';

    // Performance
    performance: NichePerformanceMetrics;

    // Availability
    isActive: boolean;
    isPremium: boolean;
    requiredRole: string;

    // Tags for discovery
    tags: string[];
}

/**
 * Niche version history entry
 */
export interface NicheVersion {
    nicheId: string;
    version: number;
    changes: string;
    snapshot: Partial<Niche>;
    createdAt: Timestamp;
    createdBy: string;
}

/**
 * User's niche preferences
 */
export interface UserNichePreference {
    nicheId: string;
    isFavorite: boolean;
    customSettings?: Partial<NicheRandomization>;
    generationCount: number;
    lastUsedAt?: Timestamp;
}
