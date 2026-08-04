import type { Config } from "drizzle-kit";

/**
 * Schema changes go over a direct (or session-mode) connection, never the
 * transaction pooler — DDL and prepared statements need a real session.
 * DIRECT_URL is that connection; DATABASE_URL stays pooled for the running app.
 */
export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  },
} satisfies Config;
