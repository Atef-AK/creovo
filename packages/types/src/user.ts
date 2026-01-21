import { AuditMetadata, Timestamp } from './common';

/**
 * User role enumeration
 */
export enum UserRole {
    FREE = 'free',
    STARTER = 'starter',
    PRO = 'pro',
    AGENCY = 'agency',
    ADMIN = 'admin',
}

/**
 * User account status
 */
export enum UserStatus {
    PENDING_VERIFICATION = 'pending_verification',
    ACTIVE = 'active',
    SUSPENDED = 'suspended',
    DELETED = 'deleted',
}

/**
 * OAuth provider types
 */
export type OAuthProvider = 'google' | 'github' | 'apple';

/**
 * Connected OAuth account
 */
export interface ConnectedAccount {
    provider: OAuthProvider;
    providerId: string;
    email: string;
    connectedAt: Timestamp;
    scopes: string[];
    accessTokenEncrypted?: string;
    refreshTokenEncrypted?: string;
    tokenExpiresAt?: Timestamp;
}

/**
 * Google Drive connection
 */
export interface GoogleDriveConnection {
    connected: boolean;
    email?: string;
    folderId?: string;
    folderName?: string;
    connectedAt?: Timestamp;
    lastSyncAt?: Timestamp;
    accessTokenEncrypted?: string;
    refreshTokenEncrypted?: string;
    tokenExpiresAt?: Timestamp;
}

/**
 * User preferences
 */
export interface UserPreferences {
    defaultPlatform: string;
    defaultNiches: string[];
    exportSettings: {
        folderStructure: 'flat' | 'by-date' | 'by-niche' | 'by-platform';
        fileNaming: string;
        includeMetadata: boolean;
        includeCaptions: boolean;
    };
    notifications: {
        email: boolean;
        jobComplete: boolean;
        jobFailed: boolean;
        weeklyDigest: boolean;
    };
}

/**
 * User usage statistics
 */
export interface UserUsageStats {
    totalGenerations: number;
    totalCreditsUsed: number;
    generationsThisMonth: number;
    creditsUsedThisMonth: number;
    lastGenerationAt?: Timestamp;
    platformBreakdown: Record<string, number>;
    nicheBreakdown: Record<string, number>;
}

/**
 * Main user document
 */
export interface User extends AuditMetadata {
    id: string;
    email: string;
    displayName?: string;
    photoUrl?: string;

    // Account
    role: UserRole;
    status: UserStatus;
    emailVerified: boolean;

    // Subscription
    subscriptionId?: string;
    subscriptionStatus?: string;
    subscriptionExpiresAt?: Timestamp;

    // Credits
    credits: number;
    creditsResetAt?: Timestamp;
    lifetimeCredits: number;

    // Connections
    connectedAccounts: ConnectedAccount[];
    googleDrive: GoogleDriveConnection;

    // Settings
    preferences: UserPreferences;

    // Stats
    usage: UserUsageStats;

    // Flags
    flags: {
        onboardingComplete: boolean;
        hasGeneratedFirstVideo: boolean;
        hasPurchased: boolean;
    };
}

/**
 * Role configuration with limits
 */
export interface RoleConfig {
    role: UserRole;
    creditsPerMonth: number;
    maxConcurrentJobs: number;
    maxResolution: '720p' | '1080p' | '4k';
    maxNiches: number | -1; // -1 = unlimited
    allowedPlatforms: string[];
    priorityQueue: boolean;
    apiAccess: boolean;
    teamAccess: boolean;
    rateLimit: {
        requestsPerMinute: number;
        generationsPerDay: number;
    };
}

/**
 * Default role configurations
 */
export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
    [UserRole.FREE]: {
        role: UserRole.FREE,
        creditsPerMonth: 5,
        maxConcurrentJobs: 1,
        maxResolution: '720p',
        maxNiches: 2,
        allowedPlatforms: ['tiktok'],
        priorityQueue: false,
        apiAccess: false,
        teamAccess: false,
        rateLimit: {
            requestsPerMinute: 10,
            generationsPerDay: 5,
        },
    },
    [UserRole.STARTER]: {
        role: UserRole.STARTER,
        creditsPerMonth: 30,
        maxConcurrentJobs: 2,
        maxResolution: '1080p',
        maxNiches: 5,
        allowedPlatforms: ['tiktok', 'youtube_shorts', 'instagram_reels'],
        priorityQueue: false,
        apiAccess: false,
        teamAccess: false,
        rateLimit: {
            requestsPerMinute: 30,
            generationsPerDay: 30,
        },
    },
    [UserRole.PRO]: {
        role: UserRole.PRO,
        creditsPerMonth: 100,
        maxConcurrentJobs: 5,
        maxResolution: '1080p',
        maxNiches: -1,
        allowedPlatforms: ['tiktok', 'youtube_shorts', 'instagram_reels', 'instagram_stories'],
        priorityQueue: true,
        apiAccess: false,
        teamAccess: false,
        rateLimit: {
            requestsPerMinute: 60,
            generationsPerDay: 100,
        },
    },
    [UserRole.AGENCY]: {
        role: UserRole.AGENCY,
        creditsPerMonth: 500,
        maxConcurrentJobs: 20,
        maxResolution: '4k',
        maxNiches: -1,
        allowedPlatforms: ['tiktok', 'youtube_shorts', 'instagram_reels', 'instagram_stories'],
        priorityQueue: true,
        apiAccess: true,
        teamAccess: true,
        rateLimit: {
            requestsPerMinute: 120,
            generationsPerDay: 500,
        },
    },
    [UserRole.ADMIN]: {
        role: UserRole.ADMIN,
        creditsPerMonth: -1,
        maxConcurrentJobs: -1,
        maxResolution: '4k',
        maxNiches: -1,
        allowedPlatforms: ['tiktok', 'youtube_shorts', 'instagram_reels', 'instagram_stories'],
        priorityQueue: true,
        apiAccess: true,
        teamAccess: true,
        rateLimit: {
            requestsPerMinute: -1,
            generationsPerDay: -1,
        },
    },
};
