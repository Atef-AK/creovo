import { AuditMetadata, Timestamp } from './common';

/**
 * Subscription status
 */
export enum SubscriptionStatus {
    ACTIVE = 'active',
    PAST_DUE = 'past_due',
    CANCELED = 'canceled',
    INCOMPLETE = 'incomplete',
    TRIALING = 'trialing',
    PAUSED = 'paused',
}

/**
 * Billing interval
 */
export type BillingInterval = 'monthly' | 'yearly';

/**
 * Subscription tier definition
 */
export interface SubscriptionTier {
    id: string;
    name: string;
    description: string;

    // Pricing
    priceMonthly: number;
    priceYearly: number;
    currency: string;

    // Stripe IDs
    stripePriceIdMonthly: string;
    stripePriceIdYearly: string;
    stripeProductId: string;

    // Credits
    creditsPerMonth: number;
    creditRollover: boolean;
    maxRolloverCredits: number;

    // Features
    features: string[];
    featureFlags: Record<string, boolean>;

    // Limits
    limits: {
        maxConcurrentJobs: number;
        maxNiches: number;
        maxResolution: string;
        apiAccess: boolean;
        priorityQueue: boolean;
        teamMembers: number;
    };

    // Display
    isPopular: boolean;
    sortOrder: number;
    isActive: boolean;
}

/**
 * User subscription record
 */
export interface Subscription extends AuditMetadata {
    id: string;
    userId: string;
    tierId: string;

    // Stripe
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    stripePriceId: string;

    // Status
    status: SubscriptionStatus;
    billingInterval: BillingInterval;

    // Dates
    currentPeriodStart: Timestamp;
    currentPeriodEnd: Timestamp;
    cancelAt?: Timestamp;
    canceledAt?: Timestamp;
    trialStart?: Timestamp;
    trialEnd?: Timestamp;

    // Payment
    latestInvoiceId?: string;
    paymentMethodId?: string;

    // Metadata
    metadata: Record<string, string>;
}

/**
 * Invoice record
 */
export interface Invoice {
    id: string;
    userId: string;
    subscriptionId: string;

    // Stripe
    stripeInvoiceId: string;
    stripeInvoiceUrl: string;
    stripePdfUrl: string;

    // Amount
    amountDue: number;
    amountPaid: number;
    currency: string;

    // Status
    status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';

    // Dates
    createdAt: Timestamp;
    dueDate?: Timestamp;
    paidAt?: Timestamp;

    // Line items
    lines: InvoiceLineItem[];
}

/**
 * Invoice line item
 */
export interface InvoiceLineItem {
    description: string;
    quantity: number;
    unitAmount: number;
    amount: number;
}

/**
 * Available add-ons
 */
export interface AddOn {
    id: string;
    name: string;
    description: string;

    // Pricing
    priceMonthly?: number;
    priceOneTime?: number;
    currency: string;

    // Stripe
    stripePriceId?: string;
    stripeProductId: string;

    // Features
    features: string[];
    featureFlags: Record<string, unknown>;

    // Availability
    isActive: boolean;
    requiredTier?: string;
    incompatibleWith?: string[];
}

/**
 * User's purchased add-ons
 */
export interface UserAddOn {
    id: string;
    userId: string;
    addOnId: string;

    // Status
    isActive: boolean;
    expiresAt?: Timestamp;

    // Stripe
    stripeSubscriptionItemId?: string;

    // Dates
    purchasedAt: Timestamp;
    canceledAt?: Timestamp;
}

/**
 * Default subscription tiers
 */
export const DEFAULT_TIERS: SubscriptionTier[] = [
    {
        id: 'starter',
        name: 'Starter',
        description: 'Perfect for content creators getting started',
        priceMonthly: 19,
        priceYearly: 190,
        currency: 'usd',
        stripePriceIdMonthly: '',
        stripePriceIdYearly: '',
        stripeProductId: '',
        creditsPerMonth: 30,
        creditRollover: false,
        maxRolloverCredits: 0,
        features: [
            '30 video credits/month',
            '5 niches',
            '1080p resolution',
            '2 concurrent jobs',
            'Google Drive export',
        ],
        featureFlags: {
            priorityQueue: false,
            apiAccess: false,
            teamAccess: false,
        },
        limits: {
            maxConcurrentJobs: 2,
            maxNiches: 5,
            maxResolution: '1080p',
            apiAccess: false,
            priorityQueue: false,
            teamMembers: 1,
        },
        isPopular: false,
        sortOrder: 1,
        isActive: true,
    },
    {
        id: 'pro',
        name: 'Pro',
        description: 'For professional content creators',
        priceMonthly: 49,
        priceYearly: 490,
        currency: 'usd',
        stripePriceIdMonthly: '',
        stripePriceIdYearly: '',
        stripeProductId: '',
        creditsPerMonth: 100,
        creditRollover: true,
        maxRolloverCredits: 50,
        features: [
            '100 video credits/month',
            'Unlimited niches',
            '1080p resolution',
            '5 concurrent jobs',
            'Priority queue',
            'Credit rollover (up to 50)',
        ],
        featureFlags: {
            priorityQueue: true,
            apiAccess: false,
            teamAccess: false,
        },
        limits: {
            maxConcurrentJobs: 5,
            maxNiches: -1,
            maxResolution: '1080p',
            apiAccess: false,
            priorityQueue: true,
            teamMembers: 1,
        },
        isPopular: true,
        sortOrder: 2,
        isActive: true,
    },
    {
        id: 'agency',
        name: 'Agency',
        description: 'For teams and high-volume creators',
        priceMonthly: 199,
        priceYearly: 1990,
        currency: 'usd',
        stripePriceIdMonthly: '',
        stripePriceIdYearly: '',
        stripeProductId: '',
        creditsPerMonth: 500,
        creditRollover: true,
        maxRolloverCredits: 200,
        features: [
            '500 video credits/month',
            'Unlimited niches',
            '4K resolution',
            '20 concurrent jobs',
            'Priority queue',
            'API access',
            'Team members (up to 5)',
            'White-label exports',
        ],
        featureFlags: {
            priorityQueue: true,
            apiAccess: true,
            teamAccess: true,
            whiteLabelExports: true,
        },
        limits: {
            maxConcurrentJobs: 20,
            maxNiches: -1,
            maxResolution: '4k',
            apiAccess: true,
            priorityQueue: true,
            teamMembers: 5,
        },
        isPopular: false,
        sortOrder: 3,
        isActive: true,
    },
];
