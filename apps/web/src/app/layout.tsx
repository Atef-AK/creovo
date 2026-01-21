import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
});

const jetbrains = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-jetbrains',
    display: 'swap',
});

export const metadata: Metadata = {
    title: {
        default: 'Lensio - AI Video Generation Platform',
        template: '%s | Lensio',
    },
    description: 'Generate viral short-form videos for TikTok, YouTube Shorts, and Instagram with AI.',
    keywords: ['AI', 'video generation', 'TikTok', 'YouTube Shorts', 'Instagram Reels', 'content creation'],
    authors: [{ name: 'Lensio' }],
    creator: 'Lensio',
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
    openGraph: {
        type: 'website',
        locale: 'en_US',
        siteName: 'Lensio',
        title: 'Lensio - AI Video Generation Platform',
        description: 'Generate viral short-form videos for TikTok, YouTube Shorts, and Instagram with AI.',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Lensio - AI Video Generation Platform',
        description: 'Generate viral short-form videos for TikTok, YouTube Shorts, and Instagram with AI.',
    },
    robots: {
        index: true,
        follow: true,
    },
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#ffffff' },
        { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
    ],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html
            lang="en"
            className={`${inter.variable} ${jetbrains.variable}`}
            suppressHydrationWarning
        >
            <body className="min-h-screen antialiased">
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
