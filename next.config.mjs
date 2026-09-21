/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    experimental: {
        instrumentationHook: true,
        // Body size limit for server actions. 🔒 This was '5000mb', which let a
        // single request exhaust server memory. Large media is uploaded as a
        // raw binary body to /api/storage/binary-upload, not via server actions.
        serverActions: {
            bodySizeLimit: '25mb',
        },
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
            // 🔒 A '**' hostname turned the Next image optimizer into an open
            // proxy: it would fetch and re-serve ANY URL on the internet at
            // your bandwidth. List the hosts you actually serve images from.
            // Both the apex domain (blog/CMS media, e.g. wp-content/uploads)
            // and any subdomain of it are covered — this is still your own
            // domain family, not an open wildcard.
            {
                protocol: 'https',
                hostname: 'mdconsultancy.in',
            },
            {
                protocol: 'https',
                hostname: '*.mdconsultancy.in',
            },
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
            },
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
        ],
    },
    async rewrites() {
        return {
            // 🔒 Runs BEFORE static files in public/. Face-verification images
            // used to sit at public/verification/** and were downloadable by
            // anyone with the URL. Funnel every request for them through the
            // authenticated secure-file route (admin or the owning student
            // only). The files stay on disk; only the way in changes.
            beforeFiles: [
                {
                    source: '/verification/:path*',
                    destination: '/api/storage/secure-file?path=/verification/:path*',
                },
            ],
        };
    },
    async headers() {
        // 🔒 The API used to answer with 'Access-Control-Allow-Origin: *' while
        // also allowing the Authorization header, so any website could call it
        // with a bearer token and read the response cross-origin. The mobile
        // app is not a browser and is unaffected by CORS; only real web
        // origins need to be listed here.
        const allowedOrigin = process.env.NEXT_PUBLIC_APP_ORIGIN || 'https://app.mdconsultancy.in';

        // Content-Security-Policy. 'unsafe-inline'/'unsafe-eval' are still
        // required by the bundled rich-text editors and chart libraries, so
        // this is defence in depth on top of the DOMPurify sanitizing in
        // src/utils/sanitizeHtml.js — not a replacement for it.
        const csp = [
            "default-src 'self'",
            "base-uri 'self'",
            "object-src 'none'",
            // Blocks this app being framed (clickjacking on the admin panel).
            "frame-ancestors 'self'",
            "form-action 'self'",
            "img-src 'self' data: blob: https:",
            "media-src 'self' blob: https:",
            "font-src 'self' data: https://fonts.gstatic.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://checkout.razorpay.com https://www.google.com https://www.gstatic.com",
            "connect-src 'self' https: wss:",
            "frame-src 'self' https://accounts.google.com https://api.razorpay.com https://www.google.com https://www.youtube.com"
        ].join('; ');

        return [
            {
                source: '/api/:path*',
                headers: [
                    { key: 'Access-Control-Allow-Credentials', value: 'false' },
                    { key: 'Access-Control-Allow-Origin', value: allowedOrigin },
                    { key: 'Vary', value: 'Origin' },
                    { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
                    { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
                ],
            },
            {
                source: '/(.*)',
                headers: [
                    { key: 'Content-Security-Policy', value: csp },
                    // HTTPS only, once you're confident every subdomain is on TLS.
                    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'Permissions-Policy', value: 'geolocation=(self), camera=(self), microphone=(self), payment=(self)' },
                    {
                        key: 'Cross-Origin-Opener-Policy',
                        // Google Sign-In's popup flow needs to talk back to the
                        // opener, so this stays relaxed deliberately.
                        value: 'unsafe-none',
                    },
                    {
                        key: 'Cross-Origin-Embedder-Policy',
                        value: 'unsafe-none',
                    },
                ],
            },
        ]
    },
    webpack: (config, { isServer }) => {
        // Fix for jodit-react and other dynamic imports
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
            };
        }
        config.resolve.alias = {
            ...config.resolve.alias,
            canvas: false,
        };
        return config;
    },
};

export default nextConfig;
