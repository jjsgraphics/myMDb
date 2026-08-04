import Link from "next/link";
import { notFound } from "next/navigation";
import { Poster } from "@/components/Poster";
import { Spine, SpineLegend } from "@/components/Spine";
import { getBoard } from "@/lib/store";
import { rankColor } from "@/lib/rank-color";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const board = await getBoard(slug);
  if (!board) notFound();

  const { category, rows, totalBallots } = board;
  const maxPoints = rows[0]?.points ?? 0;

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

              <Poster title={row.title} className="w-full" />

              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <h2 className="truncate text-[0.95rem] font-medium">
                    {row.title.name}
                  </h2>
                  {row.title.year ? (
                    <span className="tnum shrink-0 font-mono text-xs text-dim">
                      {row.title.year}
                    </span>
                  ) : null}
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

              <div className="text-right">
                <span className="tnum block font-mono text-base leading-none sm:text-lg">
                  {row.points.toLocaleString()}
                </span>
                <span className="eyebrow">pts</span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
