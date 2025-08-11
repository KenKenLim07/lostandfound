import type { NextConfig } from "next";

const supabaseHostname = (() => {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    return url ? new URL(url).hostname : undefined
  } catch {
    return undefined
  }
})()

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Allow your specific Supabase project if env is set
      ...(supabaseHostname
        ? [{ protocol: "https" as const, hostname: supabaseHostname, pathname: "/storage/v1/object/public/**" as const }]
        : []),
      // Fallback: allow any Supabase project storage (useful for mock data)
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
};

export default nextConfig;
