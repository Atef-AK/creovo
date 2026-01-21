'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores';

export default function SettingsPage() {
    const { user, signOut } = useAuthStore();
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [saving, setSaving] = useState(false);
    const [driveConnected] = useState(false);

    const handleSaveProfile = async () => {
        setSaving(true);
        // TODO: Implement profile update
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSaving(false);
    };

    const handleConnectDrive = async () => {
        // TODO: Implement Google Drive OAuth
        window.open('/api/auth/google-drive', '_blank');
    };

    return (
        <div className="max-w-3xl space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h2>
                <p className="text-slate-600 dark:text-slate-400">
                    Manage your account and preferences
                </p>
            </div>

            {/* Profile section */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    Profile
                </h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={user?.email || ''}
                            disabled
                            className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-500 cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Display Name
                        </label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="Your name"
                        />
                    </div>

                    <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Integrations section */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    Integrations
                </h3>

                <div className="space-y-4">
                    {/* Google Drive */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-600 flex items-center justify-center">
                                <svg className="w-8 h-8" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                                    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
                                    <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47" />
                                    <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335" />
                                    <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d" />
                                    <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc" />
                                    <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="font-medium text-slate-900 dark:text-white">Google Drive</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {driveConnected ? 'Connected' : 'Export videos directly to your Drive'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleConnectDrive}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${driveConnected
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-primary-600 hover:bg-primary-700 text-white'
                                }`}
                        >
                            {driveConnected ? 'Connected ✓' : 'Connect'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Subscription section */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    Subscription
                </h3>

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <div>
                        <h4 className="font-medium text-slate-900 dark:text-white capitalize">
                            {user?.role || 'Free'} Plan
                        </h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {user?.credits ?? 0} credits remaining
                        </p>
                    </div>
                    <a
                        href="/dashboard/credits"
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
                    >
                        Manage Plan
                    </a>
                </div>
            </div>

            {/* Danger zone */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-red-200 dark:border-red-900 p-6">
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
                    Danger Zone
                </h3>

                <div className="space-y-4">
                    <button
                        onClick={() => signOut()}
                        className="px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 font-medium rounded-lg transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
}
