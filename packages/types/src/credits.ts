import { Timestamp } from './common';

/**
 * Credit transaction type
 */
export enum CreditTransactionType {
    PURCHASE = 'purchase',
    SUBSCRIPTION_GRANT = 'subscription_grant',
    JOB_CHARGE = 'job_charge',
    JOB_REFUND = 'job_refund',
    ADMIN_ADJUSTMENT = 'admin_adjustment',
    REFERRAL_BONUS = 'referral_bonus',
    PROMOTIONAL = 'promotional',
    ROLLOVER = 'rollover',
    EXPIRY = 'expiry',
}

/**
 * Credit transaction record
 */
export interface CreditTransaction {
    id: string;
    userId: string;

    // Transaction details
    type: CreditTransactionType;
    amount: number; // Positive for additions, negative for deductions
    balanceAfter: number;

    // Reference
    referenceType?: 'job' | 'subscription' | 'purchase' | 'admin';
    referenceId?: string;

    // Metadata
    description: string;
    metadata?: Record<string, unknown>;

    // Audit
    createdAt: Timestamp;
    createdBy?: string; // Admin ID for manual adjustments
}

/**
 * Credit balance summary
 */
export interface CreditBalance {
    userId: string;

    // Current balance
    available: number;
    pending: number; // Reserved for in-progress jobs

    // Period tracking
    periodStart: Timestamp;
    periodEnd: Timestamp;
    periodGrant: number;
    periodUsed: number;

    // Rollover
    rolledOver: number;

    // Lifetime
    lifetimeGranted: number;
    lifetimeUsed: number;

    // Last update
    updatedAt: Timestamp;
}

/**
 * Credit purchase package
 */
export interface CreditPackage {
    id: string;
    name: string;
    credits: number;
    price: number;
    currency: string;
    stripePriceId: string;

    // Bonus
    bonusCredits: number;
    bonusPercentage: number;

    // Display
    isPopular: boolean;
    sortOrder: number;
    isActive: boolean;
}

/**
 * Credit cost estimation for a job
 */
export interface CreditEstimate {
    jobId?: string;

    // Breakdown
    breakdown: {
        scriptGeneration: number;
        imageGeneration: number;
        videoGeneration: number;
        audioSelection: number;
        assembly: number;
    };

    // Totals
    totalCredits: number;
    totalUSD: number;

    // Validation
    userCredits: number;
    canAfford: boolean;
    creditsNeeded: number;
}

/**
 * Credit value configuration
 */
export const CREDIT_CONFIG = {
    // Base value: 1 credit = $0.10 of AI cost
    creditValueUSD: 0.10,

    // Cost multipliers by component
    costMultipliers: {
        scriptGeneration: 0.2,    // ~$0.02
        imagePrompts: 0.1,        // ~$0.01 per scene
        imageGeneration: 0.4,     // ~$0.04 per image
        videoGeneration: 1.0,     // ~$0.10 per scene video
        audioSelection: 0.1,      // ~$0.01
        assembly: 0.05,           // ~$0.005
    },

    // Average job cost in credits
    averageJobCredits: 3,

    // Minimum charge
    minimumCharge: 1,
} as const;
