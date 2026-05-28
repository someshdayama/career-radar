import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
  outputFileTracingIncludes: {
    '/api/jobs/stream': ['./node_modules/@sparticuz/chromium/bin/**/*'],
    '/api/recruiters/search': ['./node_modules/@sparticuz/chromium/bin/**/*'],
  },
};

export default nextConfig;
