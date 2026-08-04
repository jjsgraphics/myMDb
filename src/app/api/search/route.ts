import { NextResponse, type NextRequest } from "next/server";
import { searchLocalTitles } from "@/lib/store";
import { searchTmdb, tmdbConfigured } from "@/lib/tmdb";

export type SearchItem = {
  key: string;
  name: string;
  year: number | null;
  mediaType: "movie" | "tv";
  posterPath: string | null;
  /** Set when the title already exists in our table. */
  titleId: string | null;
  /** Set for TMDB results we have not stored yet. */
  tmdbId: number | null;
};

/**
 * Title lookup for the ballot builder. Prefers TMDB when a key is configured
 * and falls back to titles already on the board, so search still works on a
 * bare install.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const kindParam = req.nextUrl.searchParams.get("kind") ?? "any";
  const kind = (["movie", "tv", "any"] as const).includes(kindParam as never)
    ? (kindParam as "movie" | "tv" | "any")
    : "any";

  if (q.trim().length < 2) return NextResponse.json({ items: [] });

  if (tmdbConfigured) {
    try {
      const results = await searchTmdb(q, kind);
      const items: SearchItem[] = results.map((r) => ({
        key: `tmdb:${r.mediaType}:${r.tmdbId}`,
        name: r.name,
        year: r.year,
        mediaType: r.mediaType,
        posterPath: r.posterPath,
        titleId: null,
        tmdbId: r.tmdbId,
      }));
      return NextResponse.json({ items });
    } catch (err) {
      // A TMDB outage should degrade to local search, not break the ballot.
      console.error("TMDB search failed, falling back to local", err);
    }
  }

  const local = await searchLocalTitles(q, kind);
  const items: SearchItem[] = local.map((t) => ({
    key: `local:${t.id}`,
    name: t.name,
    year: t.year,
    mediaType: t.mediaType,
    posterPath: t.posterPath,
    titleId: t.id,
    tmdbId: null,
  }));
  return NextResponse.json({ items, source: "local" });
}
