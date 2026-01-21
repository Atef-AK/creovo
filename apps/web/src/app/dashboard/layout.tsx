'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores';

interface NavItem {
    href: string;
    label: string;
    icon: string;
}

const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/dashboard/generate', label: 'Generate', icon: '🎬' },
    { href: '/dashboard/jobs', label: 'Jobs', icon: '📋' },
    { href: '/dashboard/niches', label: 'Niches', icon: '🎯' },
    { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { user, signOut } = useAuthStore();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 z-30">
                {/* Logo */}
                <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-700">
                    <Link href="/dashboard" className="text-2xl font-bold gradient-text">
                        Lensio
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                            >
                                <span className="text-lg">{item.icon}</span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Credits display */}
                <div className="absolute bottom-20 left-4 right-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white">
                        <p className="text-xs opacity-80">Credits Available</p>
                        <p className="text-2xl font-bold">{user?.credits ?? 0}</p>
                        <Link
                            href="/dashboard/credits"
                            className="mt-2 inline-block text-xs underline opacity-80 hover:opacity-100"
                        >
                            Get more credits →
                        </Link>
                    </div>
                </div>

                {/* User section */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                            <span className="text-primary-600 dark:text-primary-400 font-semibold">
                                {user?.email?.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                {user?.displayName || user?.email?.split('@')[0]}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                                {user?.role || 'free'} plan
                            </p>
                        </div>
                        <button
                            onClick={() => signOut()}
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            title="Sign out"
                        >
                            🚪
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <main className="pl-64">
                {/* Top bar */}
                <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6">
                    <div>
                        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                            {navItems.find((item) => pathname?.startsWith(item.href))?.label || 'Dashboard'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard/generate"
                            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            + New Video
                        </Link>
                    </div>
                </header>

                {/* Page content */}
                <div className="p-6">{children}</div>
            </main>
        </div>
    );
}
