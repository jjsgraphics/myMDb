/**
 * TMDB, not IMDb.
 *
 * IMDb's only official API ships through AWS Data Exchange at enterprise
 * pricing — it is not an option for a project like this. TMDB is the database
 * everything in this space actually runs on (Series Graph included), it is free
 * for non-commercial use with attribution, and it carries the posters. Each
 * result also exposes the IMDb id, so linking out to IMDb still works.
 *
 * Attribution is required: keep the TMDB credit in the footer.
 */

const BASE = "https://api.themoviedb.org/3";

export const tmdbConfigured = Boolean(process.env.TMDB_API_KEY);

export function posterUrl(path: string | null, size: "w342" | "w500" = "w342") {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
}

export type TmdbResult = {
  tmdbId: number;
  mediaType: "movie" | "tv";
  name: string;
  year: number | null;
  posterPath: string | null;
};

type RawResult = {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  popularity?: number;
};

function normalise(r: RawResult, forced?: "movie" | "tv"): TmdbResult | null {
  const mediaType = (forced ?? r.media_type) as "movie" | "tv" | undefined;
  if (mediaType !== "movie" && mediaType !== "tv") return null;
  const name = r.title ?? r.name;
  if (!name) return null;
  const date = r.release_date ?? r.first_air_date ?? "";
  const year = date ? Number(date.slice(0, 4)) : null;
  return {
    tmdbId: r.id,
    mediaType,
    name,
    year: Number.isFinite(year) ? year : null,
    posterPath: r.poster_path ?? null,
  };
}

async function get(path: string, params: Record<string, string>) {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error("TMDB_API_KEY is not set");
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const headers: Record<string, string> = { accept: "application/json" };
  // TMDB issues both a v3 key and a v4 read token. Support whichever is given.
  if (key.startsWith("ey")) headers.Authorization = `Bearer ${key}`;
  else url.searchParams.set("api_key", key);

  const res = await fetch(url, { headers, next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${await res.text()}`);
  return res.json();
}

/** Search films, series, or both, depending on what the category accepts. */
export async function searchTmdb(
  query: string,
  kind: "movie" | "tv" | "any",
): Promise<TmdbResult[]> {
  const q = query.trim();
  if (!q) return [];

  if (kind === "any") {
    const data = await get("/search/multi", { query: q, include_adult: "false" });
    return (data.results as RawResult[])
      .map((r) => normalise(r))
      .filter((r): r is TmdbResult => Boolean(r))
      .slice(0, 20);
  }

  const data = await get(`/search/${kind}`, { query: q, include_adult: "false" });
  return (data.results as RawResult[])
    .map((r) => normalise(r, kind))
    .filter((r): r is TmdbResult => Boolean(r))
    .slice(0, 20);
}

/** Best single match for a name/year pair. Used by the enrich script. */
export async function lookupTmdb(
  name: string,
  mediaType: "movie" | "tv",
  year: number,
): Promise<TmdbResult | null> {
  const params: Record<string, string> = { query: name, include_adult: "false" };
  if (mediaType === "movie") params.year = String(year);
  else params.first_air_date_year = String(year);

  const data = await get(`/search/${mediaType}`, params);
  const results = (data.results as RawResult[])
    .map((r) => normalise(r, mediaType))
    .filter((r): r is TmdbResult => Boolean(r));

  return (
    results.find((r) => r.name.toLowerCase() === name.toLowerCase()) ??
    results[0] ??
    null
  );
}
