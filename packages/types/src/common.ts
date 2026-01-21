/**
 * Common utility types used across the platform
 */

// Timestamp type for Firestore compatibility
export type Timestamp = {
    seconds: number;
    nanoseconds: number;
};

// Result wrapper for operations
export type Result<T, E = Error> =
    | { success: true; data: T }
    | { success: false; error: E };

// Pagination
export interface PaginationParams {
    limit: number;
    cursor?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
    items: T[];
    nextCursor?: string;
    hasMore: boolean;
    total?: number;
}

// Metadata
export interface AuditMetadata {
    createdAt: Timestamp;
    updatedAt: Timestamp;
    createdBy?: string;
    updatedBy?: string;
}

// Environment
export type Environment = 'development' | 'staging' | 'production';

// Status types
export type OperationStatus = 'pending' | 'processing' | 'completed' | 'failed';
