import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db, hasDatabase, schema } from "@/db";
import { computeStandings, type BallotRow } from "./scoring";
import { DEMO_AFFINITY, SEED_CATEGORIES, SEED_TITLES } from "./seed-data";

export type Category = {
  id: string;
  slug: string;
  name: string;
  blurb: string;
  kind: "movie" | "tv" | "any";
  maxPicks: number;
  minBallots: number;
  sortOrder: number;
};

export type Title = {
  id: string;
  mediaType: "movie" | "tv";
  name: string;
  year: number | null;
  posterPath: string | null;
};

export type BoardRow = {
  position: number;
  points: number;
  ballotCount: number;
  rankCounts: number[];
  title: Title;
};

export type Board = {
  category: Category;
  rows: BoardRow[];
  totalBallots: number;
};

/* =========================================================================
 * Demo store — used only when DATABASE_URL is unset.
 *
 * It exists so the project runs immediately on a fresh clone. Writes live in
 * module memory and vanish on restart, which is fine for a look around and
 * useless for anything else. Set DATABASE_URL and the Postgres path below
 * takes over with no code change.
 * ====================================================================== */

/** Deterministic PRNG. The demo board must not reshuffle between renders. */
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

type DemoState = {
  categories: Category[];
  titles: Title[];
  byName: Map<string, Title>;
  /** categorySlug -> voterId -> ordered titleIds */
  ballots: Map<string, Map<string, string[]>>;
};

const globalForDemo = globalThis as unknown as { __demo?: DemoState };

function demo(): DemoState {
  if (globalForDemo.__demo) return globalForDemo.__demo;

  const titles: Title[] = SEED_TITLES.map((t) => ({
    id: `t_${hashString(t.key).toString(36)}`,
    mediaType: t.mediaType,
    name: t.name,
    year: t.year,
    posterPath: null,
  }));
  const byName = new Map(titles.map((t) => [t.name, t]));

  const categories: Category[] = SEED_CATEGORIES.map((c, i) => ({
    id: `c_${hashString(c.slug).toString(36)}`,
    slug: c.slug,
    name: c.name,
    blurb: c.blurb,
    kind: c.kind,
    maxPicks: c.maxPicks,
    minBallots: c.minBallots,
    sortOrder: i,
  }));

  // Synthesise voters so the leaderboards have shape to look at.
  const ballots = new Map<string, Map<string, string[]>>();
  for (const cat of categories) {
    const pool = (DEMO_AFFINITY[cat.slug] ?? [])
      .map((n) => byName.get(n))
      .filter((t): t is Title => Boolean(t));
    const perCat = new Map<string, string[]>();
    if (pool.length) {
      const rand = mulberry32(hashString(cat.slug));
      const voters = 40 + Math.floor(rand() * 40);
      for (let v = 0; v < voters; v++) {
        // Weight toward the front of the affinity list so a consensus forms,
        // with enough jitter that the tail stays contested.
        const scored = pool
          .map((t, i) => ({ t, s: i * 0.8 + rand() * pool.length * 0.9 }))
          .sort((a, b) => a.s - b.s);
        const take = 5 + Math.floor(rand() * (cat.maxPicks - 4));
        perCat.set(
          `demo_voter_${v}`,
          scored.slice(0, take).map((x) => x.t.id),
        );
      }
    }
    ballots.set(cat.slug, perCat);
  }

  globalForDemo.__demo = { categories, titles, byName, ballots };
  return globalForDemo.__demo;
}

/* =========================================================================
 * Public API. Every function picks its implementation from `hasDatabase`.
 * ====================================================================== */

export async function listCategories(): Promise<Category[]> {
  if (!db) {
    return demo().categories;
  }
  const rows = await db
    .select()
    .from(schema.categories)
    .where(eq(schema.categories.archived, false))
    .orderBy(asc(schema.categories.sortOrder), asc(schema.categories.name));
  return rows.map(toCategory);
}

export async function getCategory(slug: string): Promise<Category | null> {
  if (!db) return demo().categories.find((c) => c.slug === slug) ?? null;
  const [row] = await db
    .select()
    .from(schema.categories)
    .where(eq(schema.categories.slug, slug))
    .limit(1);
  return row ? toCategory(row) : null;
}

export async function getBoard(slug: string): Promise<Board | null> {
  const category = await getCategory(slug);
  if (!category) return null;

  if (!db) {
    const state = demo();
    const perCat: Map<string, string[]> = state.ballots.get(slug) ?? new Map();
    const entries: BallotRow[] = [];
    for (const picks of perCat.values()) {
      picks.forEach((titleId, i) => entries.push({ titleId, rank: i + 1 }));
    }
    const standings = computeStandings(entries, category);
    const titleById = new Map(state.titles.map((t) => [t.id, t]));
    return {
      category,
      totalBallots: perCat.size,
      rows: standings.flatMap((s) => {
        const title = titleById.get(s.titleId);
        return title ? [{ ...s, title }] : [];
      }),
    };
  }

  const rows = await db
    .select({
      position: schema.standings.position,
      points: schema.standings.points,
      ballotCount: schema.standings.ballotCount,
      rankCounts: schema.standings.rankCounts,
      title: schema.titles,
    })
    .from(schema.standings)
    .innerJoin(schema.titles, eq(schema.titles.id, schema.standings.titleId))
    .where(eq(schema.standings.categoryId, category.id))
    .orderBy(asc(schema.standings.position));

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.ballots)
    .where(eq(schema.ballots.categoryId, category.id));

  return {
    category,
    totalBallots: count ?? 0,
    rows: rows.map((r) => ({
      position: r.position,
      points: r.points,
      ballotCount: r.ballotCount,
      rankCounts: r.rankCounts,
      title: toTitle(r.title),
    })),
  };
}

/** The signed-in person's existing picks, so the ballot builder opens on their
 *  current list rather than an empty form. */
export async function getMyBallot(
  userId: string,
  categoryId: string,
): Promise<Title[]> {
  if (!db) {
    const state = demo();
    const cat = state.categories.find((c) => c.id === categoryId);
    if (!cat) return [];
    const picks = state.ballots.get(cat.slug)?.get(userId) ?? [];
    const byId = new Map(state.titles.map((t) => [t.id, t]));
    return picks.flatMap((id) => {
      const t = byId.get(id);
      return t ? [t] : [];
    });
  }

  const rows = await db
    .select({ title: schema.titles, rank: schema.ballotEntries.rank })
    .from(schema.ballots)
    .innerJoin(
      schema.ballotEntries,
      eq(schema.ballotEntries.ballotId, schema.ballots.id),
    )
    .innerJoin(schema.titles, eq(schema.titles.id, schema.ballotEntries.titleId))
    .where(
      and(
        eq(schema.ballots.userId, userId),
        eq(schema.ballots.categoryId, categoryId),
      ),
    )
    .orderBy(asc(schema.ballotEntries.rank));

  return rows.map((r) => toTitle(r.title));
}

/**
 * Write a person's ranked list for a category, replacing any list they already
 * submitted. The `one_ballot_per_user_per_category` unique constraint means a
 * second concurrent submit updates rather than duplicates.
 */
export async function submitBallot(
  userId: string,
  categoryId: string,
  titleIds: string[],
): Promise<void> {
  if (!db) {
    const state = demo();
    const cat = state.categories.find((c) => c.id === categoryId);
    if (!cat) throw new Error("Unknown category");
    let perCat = state.ballots.get(cat.slug);
    if (!perCat) {
      perCat = new Map();
      state.ballots.set(cat.slug, perCat);
    }
    perCat.set(userId, titleIds);
    return;
  }

  await db.transaction(async (tx) => {
    const [ballot] = await tx
      .insert(schema.ballots)
      .values({ userId, categoryId })
      .onConflictDoUpdate({
        target: [schema.ballots.userId, schema.ballots.categoryId],
        set: { updatedAt: new Date() },
      })
      .returning({ id: schema.ballots.id });

    await tx
      .delete(schema.ballotEntries)
      .where(eq(schema.ballotEntries.ballotId, ballot.id));

    if (titleIds.length) {
      await tx.insert(schema.ballotEntries).values(
        titleIds.map((titleId, i) => ({
          ballotId: ballot.id,
          titleId,
          rank: i + 1,
        })),
      );
    }

    await recomputeStandings(tx, categoryId);
  });
}

type Db = NonNullable<typeof db>;
/** The handle Drizzle hands to a transaction callback. Structurally close to
 *  `Db` but not identical, so queries that run either inside or outside a
 *  transaction have to accept both. */
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

/** Rebuild the materialised board for one category. Called inside the same
 *  transaction as the ballot write so readers never see a stale board. */
async function recomputeStandings(tx: Db | Tx, categoryId: string) {
  const [category] = await tx
    .select()
    .from(schema.categories)
    .where(eq(schema.categories.id, categoryId))
    .limit(1);
  if (!category) return;

  const entries = await tx
    .select({
      titleId: schema.ballotEntries.titleId,
      rank: schema.ballotEntries.rank,
    })
    .from(schema.ballotEntries)
    .innerJoin(
      schema.ballots,
      eq(schema.ballots.id, schema.ballotEntries.ballotId),
    )
    .where(eq(schema.ballots.categoryId, categoryId));

  const standings = computeStandings(entries, {
    maxPicks: category.maxPicks,
    minBallots: category.minBallots,
  });

  await tx
    .delete(schema.standings)
    .where(eq(schema.standings.categoryId, categoryId));

  if (standings.length) {
    await tx.insert(schema.standings).values(
      standings.map((s) => ({
        categoryId,
        titleId: s.titleId,
        points: s.points,
        ballotCount: s.ballotCount,
        rankCounts: s.rankCounts,
        position: s.position,
      })),
    );
  }
}

/** Recompute every category. Use after changing minBallots or maxPicks in the
 *  admin screen, since those change what the existing ballots add up to. */
export async function recomputeAll(): Promise<void> {
  if (!db) return;
  const cats = await db.select({ id: schema.categories.id }).from(schema.categories);
  for (const c of cats) {
    await db.transaction((tx) => recomputeStandings(tx, c.id));
  }
}

export async function findTitlesByIds(ids: string[]): Promise<Title[]> {
  if (!ids.length) return [];
  if (!db) {
    const byId = new Map(demo().titles.map((t) => [t.id, t]));
    return ids.flatMap((id) => {
      const t = byId.get(id);
      return t ? [t] : [];
    });
  }
  const rows = await db
    .select()
    .from(schema.titles)
    .where(inArray(schema.titles.id, ids));
  const byId = new Map(rows.map((r) => [r.id, toTitle(r)]));
  return ids.flatMap((id) => {
    const t = byId.get(id);
    return t ? [t] : [];
  });
}

/** Local title search. Used as the demo-mode search and as the fallback when
 *  TMDB is not configured. */
export async function searchLocalTitles(
  q: string,
  kind: "movie" | "tv" | "any",
): Promise<Title[]> {
  const needle = q.trim().toLowerCase();
  if (!needle) return [];
  if (!db) {
    return demo()
      .titles.filter(
        (t) =>
          t.name.toLowerCase().includes(needle) &&
          (kind === "any" || t.mediaType === kind),
      )
      .slice(0, 20);
  }
  const rows = await db
    .select()
    .from(schema.titles)
    .where(
      kind === "any"
        ? sql`lower(${schema.titles.name}) like ${"%" + needle + "%"}`
        : and(
            sql`lower(${schema.titles.name}) like ${"%" + needle + "%"}`,
            eq(schema.titles.mediaType, kind),
          ),
    )
    .limit(20);
  return rows.map(toTitle);
}

/** Insert a title if we have not seen it before, and return the stored row.
 *  Called when someone picks a TMDB result that is not yet in our table. */
export async function ensureTitle(input: {
  tmdbId: number;
  mediaType: "movie" | "tv";
  name: string;
  year: number | null;
  posterPath: string | null;
}): Promise<Title> {
  if (!db) {
    const state = demo();
    const existing = state.titles.find(
      (t) => t.name === input.name && t.mediaType === input.mediaType,
    );
    if (existing) return existing;
    const created: Title = {
      id: `t_${hashString(`${input.mediaType}:${input.tmdbId}`).toString(36)}`,
      mediaType: input.mediaType,
      name: input.name,
      year: input.year,
      posterPath: input.posterPath,
    };
    state.titles.push(created);
    state.byName.set(created.name, created);
    return created;
  }

  const [row] = await db
    .insert(schema.titles)
    .values(input)
    .onConflictDoUpdate({
      target: [schema.titles.tmdbId, schema.titles.mediaType],
      set: { name: input.name, posterPath: input.posterPath },
    })
    .returning();
  return toTitle(row);
}

/* --- admin ------------------------------------------------------------- */

export async function upsertCategory(input: {
  id?: string;
  slug: string;
  name: string;
  blurb: string;
  kind: "movie" | "tv" | "any";
  maxPicks: number;
  minBallots: number;
}): Promise<void> {
  if (!db) throw new Error("Editing categories needs a database. Set DATABASE_URL.");
  if (input.id) {
    await db
      .update(schema.categories)
      .set(input)
      .where(eq(schema.categories.id, input.id));
  } else {
    await db.insert(schema.categories).values(input);
  }
}

export async function archiveCategory(id: string): Promise<void> {
  if (!db) throw new Error("Editing categories needs a database. Set DATABASE_URL.");
  await db
    .update(schema.categories)
    .set({ archived: true })
    .where(eq(schema.categories.id, id));
}

/* --- mappers ----------------------------------------------------------- */

type CategoryRow = typeof schema.categories.$inferSelect;
type TitleRow = typeof schema.titles.$inferSelect;

function toCategory(r: CategoryRow): Category {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    blurb: r.blurb,
    kind: r.kind,
    maxPicks: r.maxPicks,
    minBallots: r.minBallots,
    sortOrder: r.sortOrder,
  };
}

function toTitle(r: TitleRow): Title {
  return {
    id: r.id,
    mediaType: r.mediaType,
    name: r.name,
    year: r.year,
    posterPath: r.posterPath,
  };
}

export { hasDatabase };
