import type { NextConfig } from "next";

const DAY = 60 * 60 * 24;

// Static media is not content-hashed, so cache for a week and revalidate in the
// background for a year: repeat visits load videos/posters straight from disk,
// while an updated file still reaches visitors without a hard refresh.
const mediaCache = `public, max-age=${7 * DAY}, stale-while-revalidate=${365 * DAY}`;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return ["/videos/:path*", "/shots/:path*", "/space/:path*"].map((source) => ({
      source,
      headers: [{ key: "Cache-Control", value: mediaCache }],
    }));
  },
};

export default nextConfig;
