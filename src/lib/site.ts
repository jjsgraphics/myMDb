/**
 * The site's canonical origin, for absolute URLs in metadata.
 *
 * Open Graph tags and sitemaps have to be absolute — a relative URL means no
 * preview card when someone shares the link, which is exactly when it matters.
 *
 * Resolution order: an explicit SITE_URL (set this to the real domain in Vercel),
 * then Vercel's own production domain, then localhost for `npm run dev`. Not
 * NEXT_PUBLIC_, because only metadata on the server reads it.
 */
export function siteUrl(): URL {
  const explicit = process.env.SITE_URL;
  if (explicit) return new URL(explicit);

  // Set by Vercel to the project's production domain, on every deployment.
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (production) return new URL(`https://${production}`);

  return new URL("http://localhost:3000");
}
