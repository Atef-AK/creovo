import { Job, JobStatus } from './job';
import { PaginatedResponse, PaginationParams } from './common';
import { User } from './user';
import { Niche } from './niche';
import { CreditBalance, CreditEstimate, CreditTransaction } from './credits';
import { Subscription, SubscriptionTier, Invoice } from './subscription';

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: ApiError;
    meta?: {
        requestId: string;
        timestamp: string;
        version: string;
    };
}

/**
 * API error structure
 */
export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    field?: string;
}

/**
 * Common error codes
 */
export enum ApiErrorCode {
    // Authentication
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN',
    TOKEN_EXPIRED = 'TOKEN_EXPIRED',
    INVALID_TOKEN = 'INVALID_TOKEN',

    // Validation
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    INVALID_INPUT = 'INVALID_INPUT',
    MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

    // Resources
    NOT_FOUND = 'NOT_FOUND',
    ALREADY_EXISTS = 'ALREADY_EXISTS',
    CONFLICT = 'CONFLICT',

    // Rate limiting
    RATE_LIMITED = 'RATE_LIMITED',
    QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',

    // Credits
    INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',
    CREDIT_CHARGE_FAILED = 'CREDIT_CHARGE_FAILED',

    // Jobs
    JOB_NOT_FOUND = 'JOB_NOT_FOUND',
    JOB_ALREADY_COMPLETED = 'JOB_ALREADY_COMPLETED',
    JOB_CANCELLED = 'JOB_CANCELLED',
    MAX_CONCURRENT_JOBS = 'MAX_CONCURRENT_JOBS',

    // Subscription
    SUBSCRIPTION_REQUIRED = 'SUBSCRIPTION_REQUIRED',
    SUBSCRIPTION_INACTIVE = 'SUBSCRIPTION_INACTIVE',

    // External
    EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
    AI_PROVIDER_ERROR = 'AI_PROVIDER_ERROR',

    // Internal
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

// ============================================================================
// AUTH ENDPOINTS
// ============================================================================

export interface RegisterRequest {
    email: string;
    password: string;
    displayName?: string;
}

export interface RegisterResponse {
    user: Pick<User, 'id' | 'email' | 'displayName' | 'role' | 'status'>;
    token: string;
    refreshToken: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    user: Pick<User, 'id' | 'email' | 'displayName' | 'role' | 'status'>;
    token: string;
    refreshToken: string;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface RefreshTokenResponse {
    token: string;
    refreshToken: string;
}

// ============================================================================
// USER ENDPOINTS
// ============================================================================

export interface GetProfileResponse {
    user: User;
}

export interface UpdateProfileRequest {
    displayName?: string;
    preferences?: Partial<User['preferences']>;
}

export interface GetCreditsResponse {
    balance: CreditBalance;
    recentTransactions: CreditTransaction[];
}

// ============================================================================
// NICHE ENDPOINTS
// ============================================================================

export interface GetNichesRequest extends PaginationParams {
    category?: string;
    platform?: string;
    search?: string;
}

export interface GetNichesResponse extends PaginatedResponse<Niche> { }

export interface GetNicheResponse {
    niche: Niche;
}

export interface PreviewNicheResponse {
    sampleIdeas: Array<{
        topic: string;
        hook: string;
        summary: string;
    }>;
    estimatedCredits: number;
}

// ============================================================================
// GENERATION ENDPOINTS
// ============================================================================

export interface CreateJobRequest {
    nicheId: string;
    platform: string;
    options?: {
        resolution?: '720p' | '1080p' | '4k';
        duration?: number;
        customTopic?: string;
        visualStyle?: string;
    };
}

export interface CreateJobResponse {
    job: Job;
    estimatedCredits: number;
    estimatedTimeSeconds: number;
    queuePosition: number;
}

export interface GetJobResponse {
    job: Job;
}

export interface GetJobStatusResponse {
    jobId: string;
    status: JobStatus;
    progress: {
        current: string;
        step: number;
        totalSteps: number;
        percentComplete: number;
    };
    scenes?: Array<{
        id: number;
        status: string;
        imageUrl?: string;
        videoUrl?: string;
    }>;
    estimatedTimeRemaining?: number;
    creditsCharged: number;
}

export interface GetJobsRequest extends PaginationParams {
    status?: JobStatus;
    nicheId?: string;
    platform?: string;
    dateFrom?: string;
    dateTo?: string;
}

export interface GetJobsResponse extends PaginatedResponse<Job> { }

export interface CancelJobResponse {
    job: Job;
    creditsRefunded: number;
}

export interface RetryJobResponse {
    newJob: Job;
    originalJobId: string;
}

// ============================================================================
// EXPORT ENDPOINTS
// ============================================================================

export interface ExportJobRequest {
    jobId: string;
    destination: 'google_drive' | 'download';
    options?: {
        includeMetadata?: boolean;
        includeCaptions?: boolean;
        folderPath?: string;
    };
}

export interface ExportJobResponse {
    exportId: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    downloadUrl?: string;
    driveUrl?: string;
}

export interface GetExportStatusResponse {
    exportId: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    progress: number;
    downloadUrl?: string;
    driveUrl?: string;
    error?: string;
}

// ============================================================================
// SUBSCRIPTION ENDPOINTS
// ============================================================================

export interface GetSubscriptionResponse {
    subscription?: Subscription;
    tier?: SubscriptionTier;
    availableTiers: SubscriptionTier[];
}

export interface CreateCheckoutRequest {
    tierId: string;
    interval: 'monthly' | 'yearly';
    successUrl: string;
    cancelUrl: string;
}

export interface CreateCheckoutResponse {
    checkoutUrl: string;
    sessionId: string;
}

export interface CancelSubscriptionResponse {
    subscription: Subscription;
    effectiveDate: string;
}

export interface GetInvoicesResponse extends PaginatedResponse<Invoice> { }

// ============================================================================
// ESTIMATE ENDPOINTS
// ============================================================================

export interface EstimateJobRequest {
    nicheId: string;
    platform: string;
    options?: {
        resolution?: '720p' | '1080p' | '4k';
        duration?: number;
    };
}

export interface EstimateJobResponse {
    estimate: CreditEstimate;
}

// ============================================================================
// GOOGLE DRIVE ENDPOINTS
// ============================================================================

export interface ConnectGoogleDriveRequest {
    authorizationCode: string;
    redirectUri: string;
}

export interface ConnectGoogleDriveResponse {
    connected: boolean;
    email: string;
    folderId: string;
    folderName: string;
}

export interface DisconnectGoogleDriveResponse {
    disconnected: boolean;
}

// ============================================================================
// WEBHOOK PAYLOADS
// ============================================================================

export interface WebhookPayload {
    event: string;
    timestamp: string;
    data: Record<string, unknown>;
    signature: string;
}

export interface JobCompletedWebhook extends WebhookPayload {
    event: 'job.completed';
    data: {
        jobId: string;
        userId: string;
        status: JobStatus;
        videoUrl: string;
        creditsCharged: number;
    };
}

export interface JobFailedWebhook extends WebhookPayload {
    event: 'job.failed';
    data: {
        jobId: string;
        userId: string;
        error: string;
        creditsRefunded: number;
    };
}
