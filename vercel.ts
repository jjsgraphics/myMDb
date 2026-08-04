import type { VercelConfig } from "@vercel/config/v1";

/**
 * Vercel project configuration.
 *
 * Deliberately thin. Every page in this app is `force-dynamic` — boards change
 * the moment a ballot lands — so there is no caching layer worth tuning here.
 * What is worth setting is the region and the headers.
 */
export const config: VercelConfig = {
  framework: "nextjs",

  // Keep functions in the same region as the Supabase project. Every request
  // makes several round trips to Postgres, so a cross-continent hop between
  // function and database costs far more than anything else in the request.
  // Change this to match wherever you created the Supabase project.
  regions: ["iad1"],

  headers: [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Frame-Options", value: "DENY" },
      ],
    },
  ],
};

export default config;
