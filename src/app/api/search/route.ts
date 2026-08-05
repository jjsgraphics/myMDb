import { NextResponse, type NextRequest } from "next/server";
import { searchLocalTitles } from "@/lib/store";
import { limitKey, rateLimit, retryHeaders } from "@/lib/rate-limit";
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
  // This endpoint spends our TMDB quota on behalf of anonymous callers, so it
  // is the one worth capping. The builder debounces at 250ms and aborts in
  // flight, so 60/minute is far above what typing a ten-title list costs and
  // well below what a scripted loop would.
  const limited = rateLimit(limitKey(req, "search"), 60, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many searches. Give it a moment." },
      { status: 429, headers: retryHeaders(limited.retryAfter) },
    );
  }

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
