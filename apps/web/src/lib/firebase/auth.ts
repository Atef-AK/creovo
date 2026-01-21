/**
 * Firebase Authentication Service
 * 
 * Provides authentication methods with proper error handling
 * and type-safe responses.
 */

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    sendEmailVerification,
    sendPasswordResetEmail,
    updateProfile,
    onAuthStateChanged,
    User as FirebaseUser,
    UserCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getAuthInstance, getFirestoreInstance } from './config';
import { User, UserRole, UserStatus } from '@lensio/types';

// Error codes for proper handling
export enum AuthErrorCode {
    EMAIL_IN_USE = 'auth/email-already-in-use',
    INVALID_EMAIL = 'auth/invalid-email',
    WEAK_PASSWORD = 'auth/weak-password',
    USER_NOT_FOUND = 'auth/user-not-found',
    WRONG_PASSWORD = 'auth/wrong-password',
    TOO_MANY_REQUESTS = 'auth/too-many-requests',
    POPUP_CLOSED = 'auth/popup-closed-by-user',
    NETWORK_ERROR = 'auth/network-request-failed',
}

// Auth result type
export interface AuthResult<T = UserCredential> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
}

// Auth service class
class AuthService {
    private auth = getAuthInstance();
    private db = getFirestoreInstance();
    private googleProvider = new GoogleAuthProvider();

    constructor() {
        // Configure Google provider
        this.googleProvider.addScope('email');
        this.googleProvider.addScope('profile');
    }

    /**
     * Register new user with email/password
     */
    async register(
        email: string,
        password: string,
        displayName?: string
    ): Promise<AuthResult> {
        try {
            const credential = await createUserWithEmailAndPassword(
                this.auth,
                email,
                password
            );

            // Update profile if display name provided
            if (displayName) {
                await updateProfile(credential.user, { displayName });
            }

            // Send email verification
            await sendEmailVerification(credential.user);

            // Create user document in Firestore
            await this.createUserDocument(credential.user, displayName);

            return { success: true, data: credential };
        } catch (error: unknown) {
            return this.handleAuthError(error);
        }
    }

    /**
     * Sign in with email/password
     */
    async signIn(email: string, password: string): Promise<AuthResult> {
        try {
            const credential = await signInWithEmailAndPassword(
                this.auth,
                email,
                password
            );
            return { success: true, data: credential };
        } catch (error: unknown) {
            return this.handleAuthError(error);
        }
    }

    /**
     * Sign in with Google OAuth
     */
    async signInWithGoogle(): Promise<AuthResult> {
        try {
            const credential = await signInWithPopup(this.auth, this.googleProvider);

            // Check if new user
            const userDoc = await getDoc(
                doc(this.db, 'users', credential.user.uid)
            );

            if (!userDoc.exists()) {
                await this.createUserDocument(
                    credential.user,
                    credential.user.displayName ?? undefined
                );
            }

            return { success: true, data: credential };
        } catch (error: unknown) {
            return this.handleAuthError(error);
        }
    }

    /**
     * Sign out current user
     */
    async signOut(): Promise<AuthResult<void>> {
        try {
            await firebaseSignOut(this.auth);
            return { success: true };
        } catch (error: unknown) {
            return this.handleAuthError(error);
        }
    }

    /**
     * Send password reset email
     */
    async resetPassword(email: string): Promise<AuthResult<void>> {
        try {
            await sendPasswordResetEmail(this.auth, email);
            return { success: true };
        } catch (error: unknown) {
            return this.handleAuthError(error);
        }
    }

    /**
     * Resend email verification
     */
    async resendVerification(): Promise<AuthResult<void>> {
        try {
            const user = this.auth.currentUser;
            if (!user) {
                return {
                    success: false,
                    error: { code: 'no-user', message: 'No user signed in' },
                };
            }
            await sendEmailVerification(user);
            return { success: true };
        } catch (error: unknown) {
            return this.handleAuthError(error);
        }
    }

    /**
     * Get current user
     */
    getCurrentUser(): FirebaseUser | null {
        return this.auth.currentUser;
    }

    /**
     * Subscribe to auth state changes
     */
    onAuthChange(callback: (user: FirebaseUser | null) => void): () => void {
        return onAuthStateChanged(this.auth, callback);
    }

    /**
     * Get ID token for API calls
     */
    async getIdToken(): Promise<string | null> {
        const user = this.auth.currentUser;
        if (!user) return null;
        return user.getIdToken();
    }

    /**
     * Create user document in Firestore
     */
    private async createUserDocument(
        firebaseUser: FirebaseUser,
        displayName?: string
    ): Promise<void> {
        const userRef = doc(this.db, 'users', firebaseUser.uid);

        const userData: Partial<User> = {
            id: firebaseUser.uid,
            email: firebaseUser.email!,
            ...((displayName ?? firebaseUser.displayName) ? { displayName: (displayName ?? firebaseUser.displayName) as string } : {}),
            ...(firebaseUser.photoURL ? { photoUrl: firebaseUser.photoURL } : {}),
            role: UserRole.FREE,
            status: UserStatus.PENDING_VERIFICATION,
            emailVerified: firebaseUser.emailVerified,
            credits: 5, // Free tier credits
            lifetimeCredits: 5,
            connectedAccounts: [],
            googleDrive: { connected: false },
            preferences: {
                defaultPlatform: 'tiktok',
                defaultNiches: [],
                exportSettings: {
                    folderStructure: 'by-platform',
                    fileNaming: '{date}_{niche}_{id}',
                    includeMetadata: true,
                    includeCaptions: true,
                },
                notifications: {
                    email: true,
                    jobComplete: true,
                    jobFailed: true,
                    weeklyDigest: false,
                },
            },
            usage: {
                totalGenerations: 0,
                totalCreditsUsed: 0,
                generationsThisMonth: 0,
                creditsUsedThisMonth: 0,
                platformBreakdown: {},
                nicheBreakdown: {},
            },
            flags: {
                onboardingComplete: false,
                hasGeneratedFirstVideo: false,
                hasPurchased: false,
            },
        };

        await setDoc(userRef, {
            ...userData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    }

    /**
     * Handle Firebase auth errors
     */
    private handleAuthError(error: unknown): AuthResult<never> {
        const firebaseError = error as { code?: string; message?: string };

        const errorMessages: Record<string, string> = {
            [AuthErrorCode.EMAIL_IN_USE]: 'This email is already registered',
            [AuthErrorCode.INVALID_EMAIL]: 'Invalid email address',
            [AuthErrorCode.WEAK_PASSWORD]: 'Password must be at least 6 characters',
            [AuthErrorCode.USER_NOT_FOUND]: 'No account found with this email',
            [AuthErrorCode.WRONG_PASSWORD]: 'Incorrect password',
            [AuthErrorCode.TOO_MANY_REQUESTS]: 'Too many attempts. Please try again later',
            [AuthErrorCode.POPUP_CLOSED]: 'Sign in cancelled',
            [AuthErrorCode.NETWORK_ERROR]: 'Network error. Please check your connection',
        };

        return {
            success: false,
            error: {
                code: firebaseError.code ?? 'unknown',
                message: errorMessages[firebaseError.code ?? ''] ?? firebaseError.message ?? 'An error occurred',
            },
        };
    }
}

// Export singleton instance
export const authService = new AuthService();
