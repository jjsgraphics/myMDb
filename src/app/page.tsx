import Link from "next/link";
import { Poster } from "@/components/Poster";
import {
  getBoard,
  getMyPicksByCategory,
  listCategories,
  type Board,
  type MyPick,
} from "@/lib/store";
import { getViewer } from "@/lib/viewer";
import { rankColor } from "@/lib/rank-color";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, viewer] = await Promise.all([listCategories(), getViewer()]);
  const boards = (await Promise.all(categories.map((c) => getBoard(c.slug)))).filter(
    (b): b is Board => Boolean(b),
  );

  // One query for every category's picks, so the cards can each show whether
  // this person has voted without a query per card.
  const myPicks = viewer
    ? await getMyPicksByCategory(viewer.id)
    : new Map<string, MyPick[]>();

  const totalBallots = boards.reduce((n, b) => n + b.totalBallots, 0);

  return (
    <div className="mx-auto max-w-6xl px-5">
      {/* Hero. The thesis is the method: this site counts ballots, it does not
          average ratings. Say that, then get out of the way. */}
      <section className="pt-20 pb-16 sm:pt-28 sm:pb-20">
        <p className="eyebrow">
          {totalBallots.toLocaleString()} ballots counted ·{" "}
          {categories.length} categories
        </p>

        <h1 className="mt-5 max-w-3xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
          Let's get{" "}
          <span className="text-dim">real.</span>
          <br />
          Real ratings from{" "}
          <span className="text-tungsten">real people.</span>
        </h1>

        <p className="mt-6 max-w-xl text-[0.975rem] leading-relaxed text-dim">
          Not just random star ratings. Real recommendations. All leaderboards are calculated from users' own tier lists. Let's see what everyone actually puts at the top.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href={`/c/${categories[0]?.slug ?? "best-films"}/rank`}
            className="rounded-full bg-tungsten px-5 py-2.5 text-sm font-semibold text-ink transition-opacity hover:opacity-90"
          >
            Cast your first ballot
          </Link>
          <span className="text-sm text-dim">
            One list per person, per category. Change it whenever you like.
          </span>
        </div>
      </section>

      {/* How a score is built — the rank scale, stated once, up front. */}
      <section className="rule py-6">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <span className="eyebrow">Points per position</span>
          <ol className="flex flex-wrap items-end gap-1.5">
            {Array.from({ length: 10 }, (_, i) => {
              const rank = i + 1;
              return (
                <li key={rank} className="flex flex-col items-center gap-1.5">
                  <span
                    className="tnum font-mono text-[0.7rem] leading-none"
                    style={{ color: rankColor(rank, 10) }}
                  >
                    {10 - i}
                  </span>
                  <span
                    className="block w-6 rounded-full"
                    style={{
                      height: `${6 + (10 - i) * 1.6}px`,
                      background: rankColor(rank, 10),
                      opacity: 0.85,
                    }}
                  />
                  <span className="tnum font-mono text-[0.6rem] text-dim">
                    #{rank}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Category boards. */}
      <section className="py-14">
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <CategoryCard
              key={board.category.id}
              board={board}
              picks={myPicks.get(board.category.id) ?? []}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function CategoryCard({ board, picks }: { board: Board; picks: MyPick[] }) {
  const { category, rows, totalBallots } = board;
  const podium = rows.slice(0, 3);

  return (
    <Link
      href={`/c/${category.slug}`}
      className="group flex flex-col gap-4 rounded-lg border border-line/70 bg-surface/60 p-4 transition-colors hover:border-tungsten/40 hover:bg-surface"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold leading-tight tracking-tight">
            {category.name}
          </h2>
          <p className="mt-1.5 text-[0.8rem] leading-snug text-dim">
            {category.blurb}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 pt-1">
          {picks.length > 0 ? (
            <RankedBadge picks={picks} maxPicks={category.maxPicks} />
          ) : null}
          <span className="eyebrow">
            {category.kind === "movie"
              ? "Film"
              : category.kind === "tv"
                ? "Series"
                : "Both"}
          </span>
        </div>
      </div>

      {podium.length ? (
        <div className="flex items-stretch gap-2">
          {podium.map((row) => (
            <div key={row.title.id} className="flex-1">
              <Poster title={row.title} className="w-full" />
              <div className="mt-2 flex items-baseline gap-1.5">
                <span
                  className="tnum font-mono text-[0.7rem]"
                  style={{ color: rankColor(row.position, 3) }}
                >
                  {row.position}
                </span>
                <span className="truncate text-[0.72rem] leading-tight text-dim">
                  {row.title.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded border border-dashed border-line py-6 text-center text-[0.8rem] text-dim">
          No board yet. Needs {category.minBallots} ballots to open.
        </p>
      )}

      <p className="eyebrow mt-auto">
        {totalBallots.toLocaleString()}{" "}
        {totalBallots === 1 ? "ballot" : "ballots"}
      </p>
    </Link>
  );
}

/**
 * Marks a category this person has already voted in, and shows the list itself
 * on hover so they do not have to open the board to remember what they picked.
 *
 * Its own hover group rather than the card's: the card is a big target, and a
 * panel that opened on any part of it would fire constantly while reading the
 * grid. Keyboard users get the same panel when the card takes focus, since the
 * badge cannot be focusable itself — it lives inside the card's link.
 */
function RankedBadge({ picks, maxPicks }: { picks: MyPick[]; maxPicks: number }) {
  return (
    <div className="group/picks relative">
      <span
        className="flex items-center gap-1 rounded-full border border-tungsten/40 bg-tungsten/10 px-1.5 py-0.5 text-tungsten"
        aria-label={`You ranked ${picks.length} in this category`}
      >
        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" aria-hidden>
          <path
            d="M1.5 6.5 4.5 9.5 10.5 2.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="tnum font-mono text-[0.65rem] leading-none">
          {picks.length}
        </span>
      </span>

      <div className="pointer-events-none absolute right-0 top-full z-20 mt-2 w-max min-w-[10rem] max-w-[14rem] rounded-lg border border-line bg-raised p-3 opacity-0 shadow-xl transition-opacity group-focus-within:opacity-100 group-hover/picks:opacity-100">
        <p className="eyebrow">Your top {picks.length}</p>
        <ol className="mt-2 space-y-1">
          {picks.map((pick) => (
            <li
              key={pick.title.id}
              className="flex items-baseline gap-2 text-[0.75rem] leading-tight"
            >
              <span
                className="tnum shrink-0 font-mono"
                style={{ color: rankColor(pick.rank, maxPicks) }}
              >
                {pick.rank}
              </span>
              <span className="truncate">{pick.title.name}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
