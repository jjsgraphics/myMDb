/**
 * Fills in TMDB ids, poster paths and IMDb ids for titles that do not have them
 * yet. Until this runs, the UI draws its own poster tiles and shows no IMDb
 * links. Safe to re-run — each pass only looks at rows still missing the field.
 *
 *   npm run enrich
 */
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import * as schema from "../src/db/schema.ts";
import { fetchImdbId, lookupTmdb } from "../src/lib/tmdb.ts";

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error("DIRECT_URL / DATABASE_URL is not set.");
  process.exit(1);
}
if (!process.env.TMDB_API_KEY) {
  console.error(
    "TMDB_API_KEY is not set. Get one free at themoviedb.org/settings/api.",
  );
  process.exit(1);
}

const client = postgres(url, { max: 1 });
const db = drizzle(client, { schema });

// TMDB tolerates roughly 50 requests/second; this is well inside that and
// keeps the script polite on a shared key.
const pause = () => new Promise((r) => setTimeout(r, 120));

/* --- pass 1: match titles to TMDB ---------------------------------------- */

const pending = await db
  .select()
  .from(schema.titles)
  .where(isNull(schema.titles.tmdbId));

console.log(`${pending.length} titles to look up`);

let matched = 0;
for (const title of pending) {
  try {
    const hit = await lookupTmdb(title.name, title.mediaType, title.year ?? 0);
    if (!hit) {
      console.warn(`  no match: ${title.name} (${title.year})`);
      continue;
    }
    await db
      .update(schema.titles)
      .set({ tmdbId: hit.tmdbId, posterPath: hit.posterPath })
      .where(eq(schema.titles.id, title.id));
    matched++;
  } catch (err) {
    console.error(`  failed: ${title.name}`, err);
  }
  await pause();
}

console.log(`matched ${matched}/${pending.length}`);

/* --- pass 2: cross-reference to IMDb ------------------------------------- */

// Separate pass because external ids only exist on TMDB's detail endpoints, so
// this cannot be folded into the search above. Runs after pass 1 so titles
// matched just now get their IMDb id in the same invocation.
const needImdb = await db
  .select()
  .from(schema.titles)
  .where(and(isNotNull(schema.titles.tmdbId), isNull(schema.titles.imdbId)));

console.log(`${needImdb.length} titles missing an IMDb id`);

let linked = 0;
for (const title of needImdb) {
  try {
    const imdbId = await fetchImdbId(title.tmdbId!, title.mediaType);
    if (!imdbId) {
      console.warn(`  no IMDb id: ${title.name} (${title.year})`);
      continue;
    }
    await db
      .update(schema.titles)
      .set({ imdbId })
      .where(eq(schema.titles.id, title.id));
    linked++;
  } catch (err) {
    console.error(`  failed: ${title.name}`, err);
  }
  await pause();
}

console.log(`linked ${linked}/${needImdb.length} to IMDb`);
await client.end();
