import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/** Boards are the point of the site, so they are open to crawlers. Personal and
 *  administrative routes are not — they are per-visitor and would only produce
 *  useless or misleading index entries. */
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/me", "/api/", "/signin"],
    },
    sitemap: new URL("/sitemap.xml", base).toString(),
    host: base.origin,
  };
}
