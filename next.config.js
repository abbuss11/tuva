/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  // S'assure que les polices utilisées pour générer les PDF (Poppins)
  // sont bien incluses dans le bundle des fonctions serverless Vercel.
  outputFileTracingIncludes: {
    "/api/certificates/[id]/pdf": ["./src/lib/pdf/fonts/**"],
    "/api/certificates/generate": ["./src/lib/pdf/fonts/**"],
  },
};

module.exports = nextConfig;
