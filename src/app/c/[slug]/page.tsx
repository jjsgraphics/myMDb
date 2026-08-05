import Link from "next/link";
import { notFound } from "next/navigation";
import { ImdbLink } from "@/components/ImdbLink";
import { MyPicks } from "@/components/MyPicks";
import { Poster } from "@/components/Poster";
import { Spine, SpineLegend } from "@/components/Spine";
import { getBoard, getMyPicks } from "@/lib/store";
import { getViewer } from "@/lib/viewer";
import { rankColor } from "@/lib/rank-color";
import { ratingOutOf10 } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [board, viewer] = await Promise.all([getBoard(slug), getViewer()]);
  if (!board) notFound();

  const { category, rows, totalBallots } = board;
  const maxPoints = rows[0]?.points ?? 0;

  // Rendered on the server alongside the board, so seeing your own list here
  // costs no navigation and no client fetch.
  const myPicks = viewer ? await getMyPicks(viewer.id, category.id) : [];
  const myRankByTitle = new Map(myPicks.map((p) => [p.title.id, p.rank]));

  return (
    <div className="mx-auto max-w-4xl px-5">
      <header className="pt-14 pb-8">
        <Link href="/" className="eyebrow transition-colors hover:text-bone">
          ← All categories
        </Link>

        <h1 className="mt-5 font-display text-4xl font-extrabold leading-none tracking-tight sm:text-5xl">
          {category.name}
        </h1>
        <p className="mt-4 max-w-xl text-[0.95rem] leading-relaxed text-dim">
          {category.blurb}
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link
            href={`/c/${category.slug}/rank`}
            className="rounded-full bg-tungsten px-5 py-2.5 text-sm font-semibold text-ink transition-opacity hover:opacity-90"
          >
            Rank your top {category.maxPicks}
          </Link>
          <span className="eyebrow">
            {totalBallots.toLocaleString()}{" "}
            {totalBallots === 1 ? "ballot" : "ballots"}
          </span>
          <SpineLegend maxPicks={category.maxPicks} />
        </div>
      </header>

      {myPicks.length > 0 && (
        <section className="mb-10 rounded-lg border border-line/70 bg-surface/60 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <h2 className="eyebrow">
              Your ballot · {myPicks.length} of {category.maxPicks}
            </h2>
            <Link
              href={`/c/${category.slug}/rank`}
              className="text-sm text-stock underline-offset-2 hover:underline"
            >
              Edit list
            </Link>
          </div>

          <div className="mt-5">
            <MyPicks picks={myPicks} maxPicks={category.maxPicks} />
          </div>
        </section>
      )}

      {rows.length === 0 ? (
        <p className="rule py-16 text-center text-dim">
          Nothing has reached {category.minBallots} ballots yet. Be the first to
          put something on the board.
        </p>
      ) : (
        <ol className="rule">
          {rows.map((row) => (
            <li
              key={row.title.id}
              className="grid grid-cols-[2.25rem_2.5rem_1fr_auto] items-center gap-x-3 border-b border-line/50 py-3 sm:grid-cols-[3rem_3rem_1fr_auto] sm:gap-x-4"
            >
              <span
                className="tnum text-right font-mono text-lg leading-none sm:text-2xl"
                style={{
                  color:
                    row.position <= 3 ? rankColor(row.position, 3) : undefined,
                }}
              >
                {row.position}
              </span>

              <ImdbLink title={row.title} className="block">
                <Poster title={row.title} className="w-full" />
              </ImdbLink>

              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <h2 className="truncate text-[0.95rem] font-medium">
                    <ImdbLink
                      title={row.title}
                      className="underline-offset-2 transition-colors hover:text-tungsten hover:underline"
                    >
                      {row.title.name}
                    </ImdbLink>
                  </h2>
                  {row.title.year ? (
                    <span className="tnum shrink-0 font-mono text-xs text-dim">
                      {row.title.year}
                    </span>
                  ) : null}
                  <YourRank
                    rank={myRankByTitle.get(row.title.id)}
                    maxPicks={category.maxPicks}
                  />
                </div>

                <div className="mt-2 max-w-sm">
                  <Spine
                    rankCounts={row.rankCounts}
                    points={row.points}
                    maxPoints={maxPoints}
                    maxPicks={category.maxPicks}
                  />
                </div>

                <p className="eyebrow mt-1.5">
                  {row.ballotCount}{" "}
                  {row.ballotCount === 1 ? "ballot" : "ballots"}
                  {row.rankCounts[0] > 0
                    ? ` · ${row.rankCounts[0]} at #1`
                    : ""}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <span className="tnum block font-mono text-base leading-none sm:text-lg">
                  {ratingOutOf10(row.points, maxPoints).toFixed(1)}
                </span>
                <span className="eyebrow">MyMDb</span>
                <span className="tnum mt-1.5 block font-mono text-[0.65rem] text-dim">
                  {row.points.toLocaleString()} pts
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/** Marks a board row the viewer also voted for. Rendering nothing when they
 *  did not keeps the board unchanged for signed-out readers. */
function YourRank({
  rank,
  maxPicks,
}: {
  rank: number | undefined;
  maxPicks: number;
}) {
  if (rank === undefined) return null;
  const color = rankColor(rank, maxPicks);
  return (
    <span
      className="tnum shrink-0 rounded-full border px-1.5 py-0.5 font-mono text-[0.6rem] leading-none"
      style={{ color, borderColor: `color-mix(in oklab, ${color} 45%, transparent)` }}
    >
      you #{rank}
    </span>
  );
}
