/**
 * Fills in TMDB ids and poster paths for titles that do not have them yet.
 * Until this runs, the UI draws its own poster tiles.
 *
 *   npm run enrich
 */
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, isNull } from "drizzle-orm";
import * as schema from "../src/db/schema.ts";
import { lookupTmdb } from "../src/lib/tmdb.ts";

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
  // TMDB tolerates roughly 50 requests/second; this is well inside that and
  // keeps the script polite on a shared key.
  await new Promise((r) => setTimeout(r, 120));
}

console.log(`matched ${matched}/${pending.length}`);
await client.end();
