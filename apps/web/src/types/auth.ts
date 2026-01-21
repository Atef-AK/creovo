import { Timestamp } from './common';

/**
 * Authentication token payload
 */
export interface AuthTokenPayload {
    uid: string;
    email: string;
    role: string;
    emailVerified: boolean;
    exp: number;
    iat: number;
}

/**
 * Authentication session
 */
export interface AuthSession {
    userId: string;
    token: string;
    refreshToken: string;
    expiresAt: Timestamp;
    createdAt: Timestamp;
    ipAddress?: string;
    userAgent?: string;
    isActive: boolean;
}

/**
 * OAuth state for CSRF protection
 */
export interface OAuthState {
    state: string;
    provider: string;
    redirectUrl: string;
    createdAt: Timestamp;
    expiresAt: Timestamp;
    userId?: string; // Set if linking to existing account
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
    id: string;
    userId: string;
    email: string;
    tokenHash: string;
    createdAt: Timestamp;
    expiresAt: Timestamp;
    usedAt?: Timestamp;
}

/**
 * Email verification request
 */
export interface EmailVerificationRequest {
    id: string;
    userId: string;
    email: string;
    tokenHash: string;
    createdAt: Timestamp;
    expiresAt: Timestamp;
    verifiedAt?: Timestamp;
}

/**
 * Login attempt for security tracking
 */
export interface LoginAttempt {
    userId?: string;
    email: string;
    ipAddress: string;
    userAgent: string;
    success: boolean;
    failureReason?: string;
    createdAt: Timestamp;
}

/**
 * API key for programmatic access
 */
export interface ApiKey {
    id: string;
    userId: string;
    name: string;
    keyHash: string;
    keyPrefix: string; // First 8 chars for identification
    scopes: string[];
    createdAt: Timestamp;
    lastUsedAt?: Timestamp;
    expiresAt?: Timestamp;
    isActive: boolean;
}
