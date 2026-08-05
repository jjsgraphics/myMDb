/**
 * The demo identity cookie name, and nothing else.
 *
 * This lives alone, away from `viewer.ts`, because the middleware needs it and
 * the middleware runs in the Edge runtime. Importing it from `viewer.ts` drags
 * in `@/auth` → `@/db`, which instantiates a Postgres client at module scope —
 * so reading one string would pull `net`, `tls` and `stream` into an edge bundle
 * that cannot support them.
 */
export const DEMO_COOKIE = "mymdb_demo_id";
