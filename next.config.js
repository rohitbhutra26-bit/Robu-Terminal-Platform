/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { dev }) => {
    // This project lives in ~/Documents, which iCloud syncs. iCloud renames
    // files under .next/cache mid-build, corrupting webpack's on-disk cache
    // (ENOENT rename errors) and breaking CSS/PostCSS processing. Use an
    // in-memory cache during dev to avoid that race.
    if (dev) config.cache = { type: 'memory' };
    return config;
  },
};
module.exports = nextConfig;
