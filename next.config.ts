import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {source:'/models/forge/modular/:path*', headers:[{key:'Cache-Control',value:'public, max-age=3600, s-maxage=604800, stale-while-revalidate=86400'}]},
      {source:'/images/forge-signature-preview.webp',headers:[{key:'Cache-Control',value:'public, max-age=86400, s-maxage=604800'}]},
    ];
  },
};
export default nextConfig;
