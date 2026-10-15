/** @type {import('next').NextConfig} */
const nextConfig = {
  // NOTE: we do NOT use `output: 'export'` anymore. Java execution is proxied
  // through a serverless Route Handler (src/app/api/run/route.ts) that holds a
  // secret OnlineCompiler.io REST key, so the app needs Vercel's serverless
  // runtime for that one endpoint. Everything else is still static-rendered
  // and the whole thing runs comfortably on Vercel's free tier.
  images: { unoptimized: true },

  reactStrictMode: true,
};

export default nextConfig;
