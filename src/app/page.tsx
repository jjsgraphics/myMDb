import Link from "next/link";
import { Poster } from "@/components/Poster";
import { getBoard, listCategories, type Board } from "@/lib/store";
import { rankColor } from "@/lib/rank-color";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const categories = await listCategories();
  const boards = (await Promise.all(categories.map((c) => getBoard(c.slug)))).filter(
    (b): b is Board => Boolean(b),
  );

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
          Star ratings tell you what people{" "}
          <span className="text-dim">tolerate</span>.
          <br />
          Ask for a top ten and you find out what they{" "}
          <span className="text-tungsten">defend</span>.
        </h1>

        <p className="mt-6 max-w-xl text-[0.975rem] leading-relaxed text-dim">
          Pick a category, rank up to ten films or series, submit once. Every
          ballot is folded into one public board — and you can see, for any
          title, whether its score came from a devoted few or a patient many.
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
            <CategoryCard key={board.category.id} board={board} />
          ))}
        </div>
      </section>
    </div>
  );
}

function CategoryCard({ board }: { board: Board }) {
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
        <span className="eyebrow shrink-0 pt-1">
          {category.kind === "movie"
            ? "Film"
            : category.kind === "tv"
              ? "Series"
              : "Both"}
        </span>
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
