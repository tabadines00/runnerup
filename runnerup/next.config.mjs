/** @type {import('next').NextConfig} */
const nextConfig = {
    async headers() {
        return [
            {
                // matching all API routes
                source: "/:path*",
                headers: [
                    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
                    { key: "Cross-Origin-Embedder-Policy", value: "require-corp" }
                ],
            }
        ]
    },
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.output.globalObject = 'self';
        }
        return config;
    },
};

export default nextConfig;
