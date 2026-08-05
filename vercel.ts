import type { VercelConfig } from "@vercel/config/v1";

/**
 * Content Security Policy, derived from what the app actually loads.
 *
 * `unsafe-inline` on scripts is not laziness: Next inlines its bootstrap and
 * streams RSC payloads through inline <script> tags, so removing it means
 * threading a per-request nonce through middleware. That is worth doing later
 * and is not worth risking on launch day, when a CSP mistake takes the whole
 * site down rather than degrading it.
 *
 * Everything else is tight. If a future change adds an external script, an
 * embed, or a new image host, it will be blocked until it is listed here —
 * which is the point.
 */
const CSP = [
  "default-src 'self'",
  // Posters come straight from TMDB; the avatar hosts are the two providers in
  // src/auth.ts, since Viewer carries an image URL.
  "img-src 'self' data: https://image.tmdb.org https://lh3.googleusercontent.com https://cdn.discordapp.com",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  // next/font self-hosts at build time, so no external font origin is needed.
  "font-src 'self' data:",
  "connect-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

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

        // One year, subdomains included. Deliberately without `preload`:
        // submitting to the browser preload list is a commitment that is slow
        // and painful to reverse, and should be a decision rather than a side
        // effect of adding a header.
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains",
        },

        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
        },

        { key: "Content-Security-Policy", value: CSP },
      ],
    },
  ],
};

export default config;
