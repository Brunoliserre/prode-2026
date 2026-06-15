import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client"],
  // Evita que el Router Cache del cliente sirva datos viejos al navegar entre
  // páginas: con 0, cada navegación revalida contra el servidor (el "refresh"
  // queda incluido en la navegación, sin tener que recargar la página).
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "crests.football-data.org",
      },
    ],
  },
}

export default nextConfig
