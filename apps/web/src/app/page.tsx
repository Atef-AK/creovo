import Link from 'next/link';

export default function HomePage() {
    return (
        <main className="min-h-screen">
            {/* Hero Section */}
            <section className="relative overflow-hidden">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800" />

                {/* Glow effects */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl" />

                <div className="relative max-w-7xl mx-auto px-6 py-24 lg:py-32">
                    <div className="text-center">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-8">
                            <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                            AI-Powered Video Generation
                        </div>

                        {/* Heading */}
                        <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 dark:text-white mb-6">
                            Create Viral Videos
                            <br />
                            <span className="gradient-text">in Minutes</span>
                        </h1>

                        {/* Subheading */}
                        <p className="max-w-2xl mx-auto text-xl text-slate-600 dark:text-slate-300 mb-10">
                            Generate scroll-stopping content for TikTok, YouTube Shorts, and Instagram
                            with AI. From idea to export, fully automated.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/auth/register"
                                className="w-full sm:w-auto px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-primary-500/25"
                            >
                                Start Creating Free
                            </Link>
                            <Link
                                href="/auth/login"
                                className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
                            >
                                Sign In
                            </Link>
                        </div>

                        {/* Social proof */}
                        <p className="mt-10 text-sm text-slate-500 dark:text-slate-400">
                            Join 10,000+ creators generating content with Lensio
                        </p>
                    </div>
                </div>
            </section>

            {/* Platforms Section */}
            <section className="py-20 bg-white dark:bg-slate-900">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                            Create for Every Platform
                        </h2>
                        <p className="text-slate-600 dark:text-slate-300">
                            One click generates optimized content for all major platforms
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { name: 'TikTok', icon: '🎵', color: 'from-pink-500 to-red-500' },
                            { name: 'YouTube Shorts', icon: '▶️', color: 'from-red-500 to-red-600' },
                            { name: 'Instagram Reels', icon: '📸', color: 'from-purple-500 to-pink-500' },
                            { name: 'Instagram Stories', icon: '📖', color: 'from-orange-500 to-pink-500' },
                        ].map((platform) => (
                            <div
                                key={platform.name}
                                className="group relative p-6 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all hover:shadow-lg cursor-pointer"
                            >
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${platform.color} flex items-center justify-center text-2xl mb-4`}>
                                    {platform.icon}
                                </div>
                                <h3 className="font-semibold text-slate-900 dark:text-white">
                                    {platform.name}
                                </h3>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-slate-50 dark:bg-slate-800/50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                            Everything You Need
                        </h2>
                        <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                            From script to final render, our AI handles everything
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                title: 'AI Script Generation',
                                description: 'Engaging scripts tailored to your niche and platform, optimized for maximum retention.',
                                icon: '✍️',
                            },
                            {
                                title: 'Smart Image & Video',
                                description: 'Automatically generate stunning visuals and motion that match your content.',
                                icon: '🎬',
                            },
                            {
                                title: 'One-Click Export',
                                description: 'Export directly to Google Drive, ready to upload with captions and hashtags.',
                                icon: '☁️',
                            },
                        ].map((feature) => (
                            <div
                                key={feature.title}
                                className="p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                            >
                                <div className="w-14 h-14 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-3xl mb-6">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                                    {feature.title}
                                </h3>
                                <p className="text-slate-600 dark:text-slate-300">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-700">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                        Ready to Create Your First Video?
                    </h2>
                    <p className="text-primary-100 text-lg mb-10">
                        Start with 5 free credits. No credit card required.
                    </p>
                    <Link
                        href="/auth/register"
                        className="inline-flex px-8 py-4 bg-white hover:bg-slate-50 text-primary-600 font-semibold rounded-xl transition-all hover:shadow-lg"
                    >
                        Get Started Free
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 bg-slate-900 text-slate-400">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="text-2xl font-bold text-white">Lensio</div>
                        <div className="flex gap-8 text-sm">
                            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
                            <Link href="/support" className="hover:text-white transition-colors">Support</Link>
                        </div>
                        <p className="text-sm">© {new Date().getFullYear()} Lensio. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </main>
    );
}
