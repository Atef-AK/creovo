/**
 * Firebase Configuration
 * 
 * This file initializes Firebase services for the web application.
 * All Firebase instances are exported as singletons.
 */

import { initializeApp, getApps, getApp, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator, initializeFirestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, Functions, connectFunctionsEmulator } from 'firebase/functions';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.replace(/\\n/g, '').trim(),
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.replace(/\\n/g, '').trim(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.replace(/\\n/g, '').trim(),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.replace(/\\n/g, '').trim(),
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.replace(/\\n/g, '').trim(),
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.replace(/\\n/g, '').trim(),
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?.replace(/\\n/g, '').trim(),
};

// Validate configuration
function validateConfig(): void {
    const requiredKeys = ['apiKey', 'authDomain', 'projectId'];
    const missingKeys = requiredKeys.filter(
        (key) => !firebaseConfig[key as keyof typeof firebaseConfig]
    );

    if (missingKeys.length > 0 && process.env.NODE_ENV === 'production') {
        console.error(`Missing Firebase config keys: ${missingKeys.join(', ')}`);
    }
}

// Initialize Firebase app (singleton pattern)
function initializeFirebaseApp(): FirebaseApp {
    validateConfig();

    if (getApps().length > 0) {
        return getApp();
    }

    return initializeApp(firebaseConfig as FirebaseOptions);
}

// Firebase app instance
const app = initializeFirebaseApp();

// Auth instance
let auth: Auth;
export function getAuthInstance(): Auth {
    if (!auth) {
        auth = getAuth(app);

        // Connect to emulator in development
        if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
            connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
        }
    }
    return auth;
}

// Firestore instance
let firestore: Firestore;
export function getFirestoreInstance(): Firestore {
    if (!firestore) {
        firestore = initializeFirestore(app, { experimentalForceLongPolling: true });

        // Connect to emulator in development
        if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
            connectFirestoreEmulator(firestore, 'localhost', 8080);
        }
    }
    return firestore;
}

// Storage instance
let storage: FirebaseStorage;
export function getStorageInstance(): FirebaseStorage {
    if (!storage) {
        storage = getStorage(app);

        // Connect to emulator in development
        if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
            connectStorageEmulator(storage, 'localhost', 9199);
        }
    }
    return storage;
}

// Functions instance
let functions: Functions;
export function getFunctionsInstance(): Functions {
    if (!functions) {
        functions = getFunctions(app);

        // Connect to emulator in development
        if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
            connectFunctionsEmulator(functions, 'localhost', 5001);
        }
    }
    return functions;
}

// Analytics instance (only in browser)
let analytics: Analytics | null = null;
export async function getAnalyticsInstance(): Promise<Analytics | null> {
    if (typeof window === 'undefined') return null;

    if (!analytics) {
        const supported = await isSupported();
        if (supported) {
            analytics = getAnalytics(app);
        }
    }
    return analytics;
}

// Export app instance
export { app };

// Export types for convenience
export type { FirebaseApp, Auth, Firestore, FirebaseStorage, Functions, Analytics };
