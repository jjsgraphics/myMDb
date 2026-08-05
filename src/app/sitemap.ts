import type { MetadataRoute } from "next";
import { listCategories } from "@/lib/store";
import { siteUrl } from "@/lib/site";

/** Built from the categories table rather than a hardcoded list, so retiring a
 *  category in /admin drops it from the sitemap too — `listCategories` already
 *  filters archived rows. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const url = (path: string) => new URL(path, base).toString();

  const categories = await listCategories();

  return [
    { url: url("/"), changeFrequency: "hourly", priority: 1 },
    { url: url("/privacy"), changeFrequency: "yearly", priority: 0.1 },
    ...categories.map((c) => ({
      url: url(`/c/${c.slug}`),
      changeFrequency: "hourly" as const,
      priority: 0.8,
    })),
  ];
}
