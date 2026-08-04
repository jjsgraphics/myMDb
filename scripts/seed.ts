/**
 * Loads the starter categories and title pool into Postgres.
 * Safe to re-run: categories match on slug, titles on (tmdbId, mediaType).
 *
 *   npm run db:push && npm run db:seed
 */
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import * as schema from "../src/db/schema.ts";
import { SEED_CATEGORIES, SEED_TITLES } from "../src/lib/seed-data.ts";

// Prefer the direct connection: this script runs DDL and long transactions,
// which the transaction pooler is not built for.
const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error("DIRECT_URL / DATABASE_URL is not set. Add it to .env and try again.");
  process.exit(1);
}

const client = postgres(url, { max: 1 });
const db = drizzle(client, { schema });

let created = 0;
for (const [i, category] of SEED_CATEGORIES.entries()) {
  const result = await db
    .insert(schema.categories)
    .values({ ...category, sortOrder: i })
    .onConflictDoNothing({ target: schema.categories.slug })
    .returning({ id: schema.categories.id });
  created += result.length;
}
console.log(`categories: ${created} new, ${SEED_CATEGORIES.length - created} already there`);

// Titles land without TMDB ids so `npm run enrich` can claim them later. The
// partial unique index below keeps re-runs from duplicating them.
await db.execute(sql`
  create unique index if not exists titles_name_media_unique
  on titles (lower(name), media_type)
  where tmdb_id is null
`);

let titlesAdded = 0;
for (const title of SEED_TITLES) {
  const result = await db
    .insert(schema.titles)
    .values({
      mediaType: title.mediaType,
      name: title.name,
      year: title.year,
    })
    .onConflictDoNothing()
    .returning({ id: schema.titles.id });
  titlesAdded += result.length;
}
console.log(`titles: ${titlesAdded} new, ${SEED_TITLES.length - titlesAdded} already there`);

console.log("\nDone. Run `npm run enrich` next if TMDB_API_KEY is set.");
await client.end();
