/** @type {import('next').NextConfig} */
const nextConfig = {
    async headers() {
        return [
            {
                source: "/((?!q/).*)",  // Regex pattern to exclude /q/ routes
                headers: [
                  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
                  { key: "Cross-Origin-Embedder-Policy", value: "require-corp" }
                ]
            },
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
