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
        default: 'Creovo - AI Video Generation Platform',
        template: '%s | Creovo',
    },
    description: 'Generate viral short-form videos for TikTok, YouTube Shorts, and Instagram with AI.',
    keywords: ['AI', 'video generation', 'TikTok', 'YouTube Shorts', 'Instagram Reels', 'content creation'],
    authors: [{ name: 'Creovo' }],
    creator: 'Creovo',
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
    openGraph: {
        type: 'website',
        locale: 'en_US',
        siteName: 'Creovo',
        title: 'Creovo - AI Video Generation Platform',
        description: 'Generate viral short-form videos for TikTok, YouTube Shorts, and Instagram with AI.',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Creovo - AI Video Generation Platform',
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
