/**
 * Authentication Store using Zustand
 * 
 * Manages authentication state throughout the application
 * with persistence and hydration support.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { User, UserRole } from '@lensio/types';
import { authService, getFirestoreInstance } from '@/lib/firebase';

interface AuthState {
    // State
    user: User | null;
    firebaseUser: FirebaseUser | null;
    isLoading: boolean;
    isInitialized: boolean;
    error: string | null;

    // Actions
    setUser: (user: User | null) => void;
    setFirebaseUser: (user: FirebaseUser | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    initialize: () => Unsubscribe;
    reset: () => void;

    // Auth Methods
    signInWithEmail: (email: string, pass: string) => Promise<boolean>;
    signInWithGoogle: () => Promise<boolean>;
    signUpWithEmail: (email: string, pass: string, name?: string) => Promise<boolean>;
    signOut: () => Promise<void>;

    // Computed getters (as functions since Zustand doesn't support getters)
    isAuthenticated: () => boolean;
    isEmailVerified: () => boolean;
    hasRole: (role: UserRole) => boolean;
    canGenerate: () => boolean;
}

const initialState = {
    user: null,
    firebaseUser: null,
    isLoading: true,
    isInitialized: false,
    error: null,
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            ...initialState,

            setUser: (user) => set({ user }),

            setFirebaseUser: (firebaseUser) => set({ firebaseUser }),

            setLoading: (isLoading) => set({ isLoading }),

            setError: (error) => set({ error }),

            signInWithEmail: async (email, password) => {
                set({ isLoading: true, error: null });
                const result = await authService.signIn(email, password);
                if (!result.success) {
                    set({ isLoading: false, error: result.error?.message || 'Login failed' });
                    return false;
                }
                return true;
            },

            signInWithGoogle: async () => {
                set({ isLoading: true, error: null });
                const result = await authService.signInWithGoogle();
                if (!result.success) {
                    set({ isLoading: false, error: result.error?.message || 'Login failed' });
                    return false;
                }
                return true;
            },

            signUpWithEmail: async (email, password, displayName) => {
                set({ isLoading: true, error: null });
                const result = await authService.register(email, password, displayName);
                if (!result.success) {
                    set({ isLoading: false, error: result.error?.message || 'Registration failed' });
                    return false;
                }
                return true;
            },

            signOut: async () => {
                set({ isLoading: true });
                await authService.signOut();
                set({ user: null, firebaseUser: null, isLoading: false });
            },

            initialize: () => {
                const db = getFirestoreInstance();
                let userUnsubscribe: Unsubscribe | null = null;

                // Subscribe to Firebase auth state
                const authUnsubscribe = authService.onAuthChange(async (firebaseUser) => {
                    set({ firebaseUser, isLoading: true });

                    // Unsubscribe from previous user document
                    if (userUnsubscribe) {
                        userUnsubscribe();
                        userUnsubscribe = null;
                    }

                    if (firebaseUser) {
                        // Subscribe to user document in Firestore
                        const userRef = doc(db, 'users', firebaseUser.uid);
                        userUnsubscribe = onSnapshot(
                            userRef,
                            (snapshot) => {
                                if (snapshot.exists()) {
                                    set({
                                        user: { id: snapshot.id, ...snapshot.data() } as User,
                                        isLoading: false,
                                        isInitialized: true,
                                    });
                                } else {
                                    set({ user: null, isLoading: false, isInitialized: true });
                                }
                            },
                            (error) => {
                                console.error('Error fetching user:', error);
                                set({ error: error.message, isLoading: false, isInitialized: true });
                            }
                        );
                    } else {
                        set({ user: null, isLoading: false, isInitialized: true });
                    }
                });

                // Return cleanup function
                return () => {
                    authUnsubscribe();
                    if (userUnsubscribe) {
                        userUnsubscribe();
                    }
                };
            },

            reset: () => set(initialState),

            // Computed
            isAuthenticated: () => get().user !== null && get().firebaseUser !== null,

            isEmailVerified: () => get().firebaseUser?.emailVerified ?? false,

            hasRole: (role: UserRole) => {
                const user = get().user;
                if (!user) return false;

                const roleHierarchy: UserRole[] = [
                    UserRole.FREE,
                    UserRole.STARTER,
                    UserRole.PRO,
                    UserRole.AGENCY,
                    UserRole.ADMIN,
                ];

                const userRoleIndex = roleHierarchy.indexOf(user.role);
                const requiredRoleIndex = roleHierarchy.indexOf(role);

                return userRoleIndex >= requiredRoleIndex;
            },

            canGenerate: () => {
                const user = get().user;
                if (!user) return false;
                return user.credits > 0 && user.status === 'active';
            },
        }),
        {
            name: 'lensio-auth',
            storage: createJSONStorage(() => sessionStorage),
            partialize: (state) => ({
                // Only persist non-sensitive data
                isInitialized: state.isInitialized,
            }),
        }
    )
);
