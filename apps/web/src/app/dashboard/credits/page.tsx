'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores';

const creditPackages = [
    { credits: 10, price: 5, popular: false },
    { credits: 30, price: 12, popular: true },
    { credits: 100, price: 35, popular: false },
    { credits: 300, price: 90, popular: false },
];

const plans = [
    {
        id: 'free',
        name: 'Free',
        price: 0,
        credits: 5,
        features: ['5 credits/month', 'Basic niches', 'Standard queue', '720p resolution'],
        current: true,
    },
    {
        id: 'starter',
        name: 'Starter',
        price: 19,
        credits: 30,
        features: ['30 credits/month', 'All niches', 'Priority queue', '1080p resolution', 'Google Drive export'],
        popular: true,
    },
    {
        id: 'pro',
        name: 'Pro',
        price: 49,
        credits: 100,
        features: ['100 credits/month', 'All niches', 'Priority queue', '1080p resolution', 'Google Drive export', 'Custom topics', 'API access'],
    },
    {
        id: 'agency',
        name: 'Agency',
        price: 149,
        credits: 500,
        features: ['500 credits/month', 'All niches', 'Highest priority', '4K resolution', 'Google Drive export', 'Custom topics', 'API access', 'Team accounts', 'White-label'],
    },
];

export default function CreditsPage() {
    const { user } = useAuthStore();
    const [tab, setTab] = useState<'plans' | 'credits'>('plans');

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Credits & Subscription</h2>
                <p className="text-slate-600 dark:text-slate-400">
                    Manage your subscription and purchase additional credits
                </p>
            </div>

            {/* Current balance */}
            <div className="p-6 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-primary-100">Current Balance</p>
                        <p className="text-4xl font-bold">{user?.credits ?? 0} credits</p>
                        <p className="text-primary-100 mt-1 capitalize">{user?.role || 'free'} plan</p>
                    </div>
                    <div className="text-6xl opacity-20">💳</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700">
                <button
                    onClick={() => setTab('plans')}
                    className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${tab === 'plans'
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Subscription Plans
                </button>
                <button
                    onClick={() => setTab('credits')}
                    className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${tab === 'credits'
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Buy Credits
                </button>
            </div>

            {/* Plans */}
            {tab === 'plans' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`relative p-6 bg-white dark:bg-slate-800 rounded-2xl border-2 ${plan.popular
                                ? 'border-primary-500 shadow-lg shadow-primary-500/20'
                                : 'border-slate-200 dark:border-slate-700'
                                }`}
                        >
                            {plan.popular && (
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary-600 text-white text-xs font-medium rounded-full">
                                    Most Popular
                                </span>
                            )}

                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                {plan.name}
                            </h3>

                            <div className="mt-4">
                                <span className="text-3xl font-bold text-slate-900 dark:text-white">
                                    ${plan.price}
                                </span>
                                <span className="text-slate-500">/month</span>
                            </div>

                            <p className="text-primary-600 font-medium mt-2">
                                {plan.credits} credits/month
                            </p>

                            <ul className="mt-4 space-y-2">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                        <span className="text-green-500">✓</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                className={`w-full mt-6 py-2 rounded-lg font-medium transition-colors ${user?.role === plan.id
                                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-500 cursor-default'
                                    : plan.popular
                                        ? 'bg-primary-600 hover:bg-primary-700 text-white'
                                        : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
                                    }`}
                                disabled={user?.role === plan.id}
                            >
                                {user?.role === plan.id ? 'Current Plan' :
                                    plan.price === 0 ? 'Downgrade' : 'Upgrade'}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Credit packages */}
            {tab === 'credits' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {creditPackages.map((pkg) => (
                        <div
                            key={pkg.credits}
                            className={`relative p-6 bg-white dark:bg-slate-800 rounded-2xl border-2 ${pkg.popular
                                ? 'border-primary-500 shadow-lg shadow-primary-500/20'
                                : 'border-slate-200 dark:border-slate-700'
                                }`}
                        >
                            {pkg.popular && (
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary-600 text-white text-xs font-medium rounded-full">
                                    Best Value
                                </span>
                            )}

                            <div className="text-center">
                                <p className="text-4xl font-bold text-slate-900 dark:text-white">
                                    {pkg.credits}
                                </p>
                                <p className="text-slate-500">credits</p>

                                <p className="text-2xl font-bold text-primary-600 mt-4">
                                    ${pkg.price}
                                </p>
                                <p className="text-sm text-slate-400">
                                    ${(pkg.price / pkg.credits).toFixed(2)}/credit
                                </p>

                                <button className="w-full mt-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors">
                                    Buy Now
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
