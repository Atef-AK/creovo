'use client';

import Link from 'next/link';
import { useAuthStore, useJobsStore } from '@/stores';

export default function DashboardPage() {
    const { user } = useAuthStore();
    const { jobs } = useJobsStore();

    const recentJobs = jobs.slice(0, 5);
    const activeJobs = jobs.filter(j =>
        !['completed', 'failed', 'cancelled'].includes(j.status)
    );
    const completedJobs = jobs.filter(j => j.status === 'completed');

    return (
        <div className="space-y-8">
            {/* Welcome section */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Welcome back, {user?.displayName || 'Creator'}! 👋
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400">
                        Ready to create some amazing content?
                    </p>
                </div>
                <Link
                    href="/dashboard/generate"
                    className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-500/25"
                >
                    Start Creating
                </Link>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-2xl mb-4">
                        💳
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Credits Available</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                        {user?.credits ?? 0}
                    </p>
                </div>

                <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-2xl mb-4">
                        ⚡
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Active Jobs</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                        {activeJobs.length}
                    </p>
                </div>

                <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-2xl mb-4">
                        ✅
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Completed</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                        {completedJobs.length}
                    </p>
                </div>

                <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-2xl mb-4">
                        ⭐
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Plan</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white capitalize">
                        {user?.role || 'Free'}
                    </p>
                </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link
                    href="/dashboard/niches"
                    className="group p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center text-3xl">
                            🎯
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                Browse Niches
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Explore content categories
                            </p>
                        </div>
                    </div>
                </Link>

                <Link
                    href="/dashboard/jobs"
                    className="group p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-3xl">
                            📋
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                View Jobs
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Track your generations
                            </p>
                        </div>
                    </div>
                </Link>

                <Link
                    href="/dashboard/settings"
                    className="group p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-3xl">
                            ⚙️
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                Settings
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Manage your account
                            </p>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Recent activity */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900 dark:text-white">Recent Jobs</h3>
                    <Link
                        href="/dashboard/jobs"
                        className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                    >
                        View all →
                    </Link>
                </div>

                {recentJobs.length > 0 ? (
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {recentJobs.map((job) => (
                            <div key={job.id} className="px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                        {job.status === 'completed' ? '✅' :
                                            job.status === 'failed' ? '❌' :
                                                job.status === 'cancelled' ? '🚫' : '⏳'}
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white">
                                            {job.idea?.topic || 'Video Generation'}
                                        </p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {job.platform} • {new Date(job.createdAt.seconds * 1000).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${job.status === 'completed'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : job.status === 'failed'
                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                    }`}>
                                    {job.status}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="px-6 py-12 text-center">
                        <p className="text-slate-500 dark:text-slate-400">No jobs yet</p>
                        <Link
                            href="/dashboard/generate"
                            className="mt-4 inline-block text-primary-600 dark:text-primary-400 hover:underline"
                        >
                            Create your first video →
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
