/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "**" },
    ],
  },
  async redirects() {
    return [
      {
        source: "/apply",
        destination: "/register/nanny",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.firebaseapp.com https://*.googleapis.com https://*.stripe.com https://api.mapbox.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.mapbox.com",
              "img-src 'self' data: blob: https://*.googleusercontent.com https://api.dicebear.com https://*.stripe.com https://*.mapbox.com https://*.r2.dev https://*.cloudflarestorage.com https://*.cloudinary.com",
              "font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com",
              "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://*.firebaseapp.com wss://*.firebaseio.com https://*.stripe.com wss://*.ably.io https://*.ably.io https://realtime.ably.io wss://*.ably.net https://*.ably.net https://*.ably-realtime.com wss://*.ably-realtime.com https://*.mapbox.com https://us.i.posthog.com https://ipapi.co http://ip-api.com https://*.r2.dev https://*.cloudflarestorage.com",
              "frame-src 'self' https://*.stripe.com https://*.firebaseapp.com",
              "media-src 'self' blob: https://*.r2.dev https://*.cloudflarestorage.com",
              "worker-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'"
            ].join("; ")
          }
        ],
      },
    ];
  },
  turbopack: {
    root: ".",
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
