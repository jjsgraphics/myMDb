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

  // Matched to the Supabase project, which is in eu-west-2 (London). Every
  // request makes several round trips to Postgres, so a cross-continent hop
  // between function and database costs far more than anything else in the
  // request. lhr1 is Vercel's London region.
  regions: ["lhr1"],

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
