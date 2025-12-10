/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    experimental: {
        instrumentationHook: true,
        isrMemoryCacheSize: 0,
    },
    // Enhanced file upload configuration
    api: {
        bodyParser: {
            sizeLimit: '500mb', // Allow up to 500MB uploads
        },
        responseLimit: false,
    },
    // Server configuration for large files
    serverRuntimeConfig: {
        maxFileSize: 500 * 1024 * 1024, // 500MB
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'hinguland.com',
            },
            {
                protocol: 'http',
                hostname: 'localhost',
            },
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'Cross-Origin-Opener-Policy',
                        value: 'unsafe-none',
                    },
                    {
                        key: 'Cross-Origin-Embedder-Policy',
                        value: 'unsafe-none',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'origin-when-cross-origin',
                    },
                ],
            },
        ]
    },
};

export default nextConfig;
