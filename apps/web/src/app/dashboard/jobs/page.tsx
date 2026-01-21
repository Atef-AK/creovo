'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useJobsStore } from '@/stores';
import type { Job } from '@lensio/types';

const statusColors: Record<string, string> = {
    pending: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    queued: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    processing: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    cancelled: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
};

export default function JobsPage() {
    const { jobs, filters, setFilters } = useJobsStore();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredJobs = jobs.filter((job) => {
        if (filters.status && job.status !== filters.status) return false;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                job.idea?.topic?.toLowerCase().includes(query) ||
                job.platform.toLowerCase().includes(query) ||
                job.nicheId.toLowerCase().includes(query)
            );
        }
        return true;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Jobs</h2>
                    <p className="text-slate-600 dark:text-slate-400">
                        Track your video generation jobs
                    </p>
                </div>
                <Link
                    href="/dashboard/generate"
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
                >
                    + New Video
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Search jobs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {['all', 'pending', 'processing', 'completed', 'failed'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilters({ ...filters, status: (status === 'all' ? undefined : status) as any })}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${(filters.status === undefined && status === 'all') || filters.status === status
                                ? 'bg-primary-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Jobs list */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {filteredJobs.length > 0 ? (
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {filteredJobs.map((job) => (
                            <JobRow key={job.id} job={job} />
                        ))}
                    </div>
                ) : (
                    <div className="px-6 py-16 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-3xl">
                            📋
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                            No jobs found
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-4">
                            {filters.status ? 'No jobs match this filter' : 'Start generating videos to see them here'}
                        </p>
                        <Link
                            href="/dashboard/generate"
                            className="inline-block px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
                        >
                            Create your first video
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

function JobRow({ job }: { job: Job }) {
    const getProgressText = () => {
        if (job.status === 'completed') return '100%';
        if (job.status === 'failed' || job.status === 'cancelled') return '--';
        return `${job.progress || 0}%`;
    };

    return (
        <Link
            href={`/dashboard/jobs/${job.id}`}
            className="block px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
        >
            <div className="flex items-center gap-4">
                {/* Platform icon */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-xl flex-shrink-0">
                    {job.platform === 'tiktok' ? '🎵' :
                        job.platform === 'youtube_shorts' ? '▶️' :
                            job.platform === 'instagram_reels' ? '📸' : '🎬'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-900 dark:text-white truncate">
                        {job.idea?.topic || 'Video Generation'}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {job.platform.replace('_', ' ')} • {new Date(job.createdAt.seconds * 1000).toLocaleDateString()}
                    </p>
                </div>

                {/* Progress */}
                <div className="text-right flex-shrink-0">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[job.status] || statusColors.pending
                        }`}>
                        {job.status}
                    </span>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {getProgressText()}
                    </p>
                </div>
            </div>

            {/* Progress bar for active jobs */}
            {['processing', 'queued'].includes(job.status) && (
                <div className="mt-3 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary-500 rounded-full transition-all duration-500"
                        style={{ width: `${job.progress || 0}%` }}
                    />
                </div>
            )}
        </Link>
    );
}
