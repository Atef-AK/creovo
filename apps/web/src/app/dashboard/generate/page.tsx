'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores';
import { nichesApi, jobsApi } from '@/lib/api';

import { Niche } from '@lensio/types';

const platforms = [
    { id: 'tiktok', name: 'TikTok', icon: '🎵', color: 'from-pink-500 to-red-500' },
    { id: 'youtube_shorts', name: 'YouTube Shorts', icon: '▶️', color: 'from-red-500 to-red-600' },
    { id: 'instagram_reels', name: 'Instagram Reels', icon: '📸', color: 'from-purple-500 to-pink-500' },
];

export default function GeneratePage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [step, setStep] = useState<'niche' | 'platform' | 'options' | 'confirm'>('niche');
    const [niches, setNiches] = useState<Niche[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    // Selection state
    const [selectedNiche, setSelectedNiche] = useState<Niche | null>(null);
    const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
    const [duration, setDuration] = useState(30);
    const [customTopic, setCustomTopic] = useState('');

    useEffect(() => {
        loadNiches();
    }, []);

    const loadNiches = async () => {
        setLoading(true);
        try {
            const response = await nichesApi.list();
            if (response.success && response.data) {
                setNiches(response.data.items);
            }
        } catch (error) {
            console.error('Failed to load niches:', error);
        }
        setLoading(false);
    };

    const handleGenerate = async () => {
        if (!selectedNiche || !selectedPlatform) return;

        setGenerating(true);
        try {
            const response = await jobsApi.create({
                nicheId: selectedNiche.id,
                platform: selectedPlatform as any,
                options: {
                    duration,
                    ...(customTopic ? { customTopic } : {}),
                },
            });

            if (response.success && response.data) {
                router.push(`/dashboard/jobs/${response.data.job.id}`);
            }
        } catch (error) {
            console.error('Failed to create job:', error);
        }
        setGenerating(false);
    };

    const estimatedCredits = selectedNiche?.estimatedCreditCost || 3;
    const canAfford = (user?.credits || 0) >= estimatedCredits;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Generate Video</h2>
                <p className="text-slate-600 dark:text-slate-400">
                    Create a new AI-generated video in minutes
                </p>
            </div>

            {/* Progress steps */}
            <div className="flex items-center gap-2">
                {['niche', 'platform', 'options', 'confirm'].map((s, i) => (
                    <div key={s} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === s
                            ? 'bg-primary-600 text-white'
                            : i < ['niche', 'platform', 'options', 'confirm'].indexOf(step)
                                ? 'bg-green-500 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                            }`}>
                            {i < ['niche', 'platform', 'options', 'confirm'].indexOf(step) ? '✓' : i + 1}
                        </div>
                        {i < 3 && <div className="w-12 h-0.5 bg-slate-200 dark:bg-slate-700 mx-2" />}
                    </div>
                ))}
            </div>

            {/* Step content */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                {step === 'niche' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Choose a Niche
                        </h3>
                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="h-32 bg-slate-100 dark:bg-slate-700 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {niches.map((niche) => (
                                    <button
                                        key={niche.id}
                                        onClick={() => {
                                            setSelectedNiche(niche);
                                            setStep('platform');
                                        }}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${selectedNiche?.id === niche.id
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                            : 'border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <h4 className="font-medium text-slate-900 dark:text-white">
                                                {niche.name}
                                            </h4>
                                            {niche.isPremium && (
                                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                                                    Premium
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                            {niche.description}
                                        </p>
                                        <div className="flex items-center gap-2 mt-3">
                                            <span className="text-xs text-primary-600 dark:text-primary-400">
                                                ~{niche.estimatedCreditCost} credits
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {step === 'platform' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Select Platform
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {platforms.map((platform) => (
                                <button
                                    key={platform.id}
                                    onClick={() => {
                                        setSelectedPlatform(platform.id);
                                        setStep('options');
                                    }}
                                    className={`p-6 rounded-xl border-2 text-center transition-all ${selectedPlatform === platform.id
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-primary-300'
                                        }`}
                                >
                                    <div className={`w-16 h-16 mx-auto rounded-xl bg-gradient-to-br ${platform.color} flex items-center justify-center text-3xl mb-3`}>
                                        {platform.icon}
                                    </div>
                                    <h4 className="font-medium text-slate-900 dark:text-white">
                                        {platform.name}
                                    </h4>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setStep('niche')}
                            className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        >
                            ← Back
                        </button>
                    </div>
                )}

                {step === 'options' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Options
                        </h3>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Duration (seconds)
                            </label>
                            <div className="flex gap-2">
                                {[15, 30, 45, 60].map((d) => (
                                    <button
                                        key={d}
                                        onClick={() => setDuration(d)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${duration === d
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                            }`}
                                    >
                                        {d}s
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Custom Topic (optional)
                            </label>
                            <input
                                type="text"
                                value={customTopic}
                                onChange={(e) => setCustomTopic(e.target.value)}
                                placeholder="Leave empty for AI-generated topic"
                                className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setStep('platform')}
                                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900"
                            >
                                ← Back
                            </button>
                            <button
                                onClick={() => setStep('confirm')}
                                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                )}

                {step === 'confirm' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Confirm Generation
                        </h3>

                        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl space-y-3">
                            <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-400">Niche</span>
                                <span className="font-medium text-slate-900 dark:text-white">{selectedNiche?.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-400">Platform</span>
                                <span className="font-medium text-slate-900 dark:text-white">
                                    {platforms.find(p => p.id === selectedPlatform)?.name}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-400">Duration</span>
                                <span className="font-medium text-slate-900 dark:text-white">{duration} seconds</span>
                            </div>
                            {customTopic && (
                                <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-slate-400">Topic</span>
                                    <span className="font-medium text-slate-900 dark:text-white">{customTopic}</span>
                                </div>
                            )}
                            <hr className="border-slate-200 dark:border-slate-600" />
                            <div className="flex justify-between text-lg">
                                <span className="font-medium text-slate-900 dark:text-white">Cost</span>
                                <span className="font-bold text-primary-600">{estimatedCredits} credits</span>
                            </div>
                        </div>

                        {!canAfford && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                                <p className="text-red-700 dark:text-red-400">
                                    You don't have enough credits.
                                    <Link href="/dashboard/credits" className="underline ml-1">Get more credits</Link>
                                </p>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                onClick={() => setStep('options')}
                                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900"
                            >
                                ← Back
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={!canAfford || generating}
                                className={`flex-1 px-6 py-3 font-semibold rounded-xl transition-all ${canAfford && !generating
                                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white shadow-lg shadow-primary-500/25'
                                    : 'bg-slate-300 dark:bg-slate-600 text-slate-500 cursor-not-allowed'
                                    }`}
                            >
                                {generating ? 'Creating...' : 'Generate Video 🚀'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
