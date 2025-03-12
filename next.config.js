/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Desativando o modo estrito para evitar problemas com o react-beautiful-dnd
  swcMinify: true,
  images: {
    domains: ['localhost', 'supabase.co', 'xrzjyqsnfwtnhasbsxxy.supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  experimental: {
    optimizeCss: true,
    serverActions: true,
  },
}

module.exports = nextConfig 