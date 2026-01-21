'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { nichesApi } from '@/lib/api';
import { Niche } from '@lensio/types';

const categoryColors: Record<string, string> = {
    lifestyle: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    technology: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    entertainment: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    health: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    finance: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    education: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
};

const categories = ['all', 'lifestyle', 'technology', 'entertainment', 'health', 'finance', 'education'];

export default function NichesPage() {
    const [niches, setNiches] = useState<Niche[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

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

    const filteredNiches = niches.filter((niche) => {
        if (selectedCategory !== 'all' && niche.category !== selectedCategory) return false;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                niche.name.toLowerCase().includes(query) ||
                niche.description.toLowerCase().includes(query) ||
                niche.tags.some(t => t.toLowerCase().includes(query))
            );
        }
        return true;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Content Niches</h2>
                <p className="text-slate-600 dark:text-slate-400">
                    Explore categories to create engaging content
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Search niches..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${selectedCategory === cat
                                ? 'bg-primary-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Niches grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredNiches.map((niche) => (
                        <Link
                            key={niche.id}
                            href={`/dashboard/generate?niche=${niche.id}`}
                            className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 hover:border-primary-300 dark:hover:border-primary-700 transition-all hover:shadow-lg"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${categoryColors[niche.category] || categoryColors.lifestyle
                                    }`}>
                                    {niche.category}
                                </span>
                                {niche.isPremium && (
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                                        ⭐ Premium
                                    </span>
                                )}
                            </div>

                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                {niche.name}
                            </h3>

                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                                {niche.description}
                            </p>

                            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                    ~{niche.estimatedCreditCost} credits
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                    ~{niche.averageDuration}s duration
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-1 mt-3">
                                {niche.tags.slice(0, 3).map((tag) => (
                                    <span
                                        key={tag}
                                        className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs rounded"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {!loading && filteredNiches.length === 0 && (
                <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-3xl">
                        🔍
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                        No niches found
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400">
                        Try adjusting your search or filters
                    </p>
                </div>
            )}
        </div>
    );
}
