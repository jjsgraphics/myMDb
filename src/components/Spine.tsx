import { rankColor } from "@/lib/rank-color";
import { pointsForRank } from "@/lib/scoring";

/**
 * The consensus spine.
 *
 * Total length is the title's points as a share of the leader's, so the board
 * reads as a bar chart at a glance. The segments inside are what a bare total
 * hides: each one is the points contributed by voters who placed the title at a
 * particular rank, coloured on the shared rank scale.
 *
 * That composition is the interesting part. A film carried by a handful of
 * devoted first places shows a short amber spine; one that nearly everybody
 * ranked seventh shows a long cyan one. Both can total the same score, and they
 * mean completely different things about what people think.
 */
export function Spine({
  rankCounts,
  points,
  maxPoints,
  maxPicks,
}: {
  rankCounts: number[];
  points: number;
  maxPoints: number;
  maxPicks: number;
}) {
  const width = maxPoints > 0 ? Math.max((points / maxPoints) * 100, 1.5) : 0;

  const segments = rankCounts
    .map((count, i) => ({
      rank: i + 1,
      count,
      weight: count * pointsForRank(i + 1, maxPicks),
    }))
    .filter((s) => s.weight > 0);

  return (
    <div
      className="h-[6px] w-full overflow-hidden rounded-full bg-line/50"
      role="img"
      aria-label={`${points} points from ${rankCounts.reduce((a, b) => a + b, 0)} ballots`}
    >
      <div className="flex h-full" style={{ width: `${width}%` }}>
        {segments.map((s) => (
          <div
            key={s.rank}
            style={{
              flexGrow: s.weight,
              background: rankColor(s.rank, maxPicks),
            }}
            title={`${s.count} ${s.count === 1 ? "voter" : "voters"} ranked it #${s.rank}`}
          />
        ))}
      </div>
    </div>
  );
}

/** Compact legend explaining the spine's colour scale. Shown once per board. */
export function SpineLegend({ maxPicks }: { maxPicks: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="eyebrow">#1</span>
      <div className="flex h-[6px] w-24 overflow-hidden rounded-full">
        {Array.from({ length: maxPicks }, (_, i) => (
          <div
            key={i}
            className="flex-1"
            style={{ background: rankColor(i + 1, maxPicks) }}
          />
        ))}
      </div>
      <span className="eyebrow">#{maxPicks}</span>
    </div>
  );
}
