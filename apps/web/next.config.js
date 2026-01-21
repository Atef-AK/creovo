/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,

    // Mark undici as external to avoid parsing issues with private class fields
    serverExternalPackages: ['undici'],
    transpilePackages: ['firebase', '@firebase/auth', '@firebase/functions', '@firebase/storage'],

    // Performance optimizations
    poweredByHeader: false,
    compress: true,

    // ESLint
    eslint: {
        ignoreDuringBuilds: true,
    },

    // TypeScript
    typescript: {
        ignoreBuildErrors: true,
    },

    // Image optimization
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'storage.googleapis.com',
            },
            {
                protocol: 'https',
                hostname: '*.googleusercontent.com',
            },
        ],
    },

    // Headers for security
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'on',
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'SAMEORIGIN',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'origin-when-cross-origin',
                    },
                ],
            },
        ];
    },

    webpack: (config, { isServer }) => {
        // Exclude undici from both client and server bundles
        config.resolve.alias = {
            ...config.resolve.alias,
            undici: false,
        };

        // Ignore undici in webpack bundling
        config.externals = config.externals || [];
        if (isServer) {
            config.externals.push('undici');
        }

        return config;
    },

    // Environment variables exposed to browser
    env: {
        NEXT_PUBLIC_APP_NAME: 'Creovo',
        NEXT_PUBLIC_APP_VERSION: '1.0.0',
    },
};

module.exports = nextConfig;
