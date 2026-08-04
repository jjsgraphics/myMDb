import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * A database is optional. With no DATABASE_URL the app falls back to an
 * in-memory demo store so `npm run dev` works on a fresh clone — see
 * `src/lib/store.ts`.
 */
export const hasDatabase = Boolean(process.env.DATABASE_URL);

const globalForDb = globalThis as unknown as {
  __sql?: ReturnType<typeof postgres>;
};

function client() {
  if (!globalForDb.__sql) {
    const url = process.env.DATABASE_URL!;

    // Supabase's transaction pooler (Supavisor, port 6543) multiplexes many
    // clients onto few Postgres connections, which is what you want in front
    // of serverless functions — but it cannot support prepared statements.
    // Leaving them on produces "prepared statement already exists" errors that
    // only show up under concurrency, so detect the pooler and turn them off.
    const pooled = url.includes("pooler.supabase.com");

    globalForDb.__sql = postgres(url, {
      max: pooled ? 3 : 5,
      prepare: !pooled,
      idle_timeout: 20,
    });
  }
  return globalForDb.__sql;
}

export const db = hasDatabase ? drizzle(client(), { schema }) : null;

export { schema };
