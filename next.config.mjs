/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Désactive totalement le cache Webpack pour éviter les crashs mémoire sur Windows
    config.cache = false;
    return config;
  },
};

export default nextConfig;
