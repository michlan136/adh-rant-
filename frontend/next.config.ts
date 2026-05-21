import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // On récupère l'adresse de ton backend sur Render. 
    // S'il n'y en a pas (sur ton PC), on garde localhost par sécurité.
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`, // L'adresse devient dynamique !
      }
    ];
  },
};

export default nextConfig;
