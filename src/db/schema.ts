import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

/* ---------------------------------------------------------------------------
 * Auth.js tables. Identity is what makes "one list per person" enforceable, so
 * these are load-bearing rather than boilerplate.
 * ------------------------------------------------------------------------ */

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  handle: text("handle").unique(),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

/* ---------------------------------------------------------------------------
 * The product itself.
 * ------------------------------------------------------------------------ */

/** A poll. Fully editable at runtime from /admin — this is why categories are
 *  rows and not a hardcoded enum. */
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  /** Shown under the title. Sets the question voters are actually answering. */
  blurb: text("blurb").notNull().default(""),
  /** Restricts what can be nominated: films only, series only, or both. */
  kind: text("kind").$type<"movie" | "tv" | "any">().notNull().default("any"),
  /** Ballot length. 10 by default, but a category can ask for fewer. */
  maxPicks: smallint("max_picks").notNull().default(10),
  /** A title needs this many ballots before it shows on the ranked board.
   *  Without it, one enthusiastic voter mints a #1. */
  minBallots: smallint("min_ballots").notNull().default(3),
  sortOrder: integer("sort_order").notNull().default(0),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** A film or series. Mirrored from TMDB so ballots survive upstream edits. */
export const titles = pgTable(
  "titles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tmdbId: integer("tmdb_id"),
    mediaType: text("media_type").$type<"movie" | "tv">().notNull(),
    name: text("name").notNull(),
    year: smallint("year"),
    posterPath: text("poster_path"),
    imdbId: text("imdb_id"),
  },
  (t) => [unique("titles_tmdb_unique").on(t.tmdbId, t.mediaType)],
);

/** One person's ranked list for one category.
 *
 *  The unique constraint below is the entire answer to "how do I stop people
 *  submitting twice" — it is enforced by Postgres, not by app code, so a race
 *  between two tabs still cannot produce two ballots. Re-submitting edits this
 *  row in place. */
export const ballots = pgTable(
  "ballots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    unique("one_ballot_per_user_per_category").on(t.userId, t.categoryId),
    index("ballots_category_idx").on(t.categoryId),
  ],
);

export const ballotEntries = pgTable(
  "ballot_entries",
  {
    ballotId: uuid("ballot_id")
      .notNull()
      .references(() => ballots.id, { onDelete: "cascade" }),
    titleId: uuid("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    /** 1-indexed. 1 is the voter's top pick. */
    rank: smallint("rank").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.ballotId, t.rank] }),
    unique("no_duplicate_title_per_ballot").on(t.ballotId, t.titleId),
  ],
);

/** Materialised leaderboard. Recomputed per category on every ballot write so
 *  reads are a single indexed scan. */
export const standings = pgTable(
  "standings",
  {
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    titleId: uuid("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    points: integer("points").notNull().default(0),
    ballotCount: integer("ballot_count").notNull().default(0),
    /** rankCounts[i] = how many voters placed this title at rank i+1.
     *  Drives the consensus spine in the UI. */
    rankCounts: integer("rank_counts").array().notNull(),
    position: integer("position").notNull(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.categoryId, t.titleId] }),
    index("standings_board_idx").on(t.categoryId, t.position),
  ],
);
