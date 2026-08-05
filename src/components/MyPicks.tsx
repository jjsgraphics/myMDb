import { ImdbLink } from "@/components/ImdbLink";
import { Poster } from "@/components/Poster";
import { rankColor } from "@/lib/rank-color";
import type { MyPick } from "@/lib/store";

/**
 * A person's own ranked list, rendered as posters in ballot order.
 *
 * Each pick carries both numbers: the rank they gave it, on the shared colour
 * scale, and where the crowd put it. The gap between those two is the only
 * thing on this site that is genuinely *yours* — everything else is consensus —
 * so it is shown on the pick rather than left for the reader to work out.
 */
export function MyPicks({
  picks,
  maxPicks,
}: {
  picks: MyPick[];
  maxPicks: number;
}) {
  return (
    <ol className="flex flex-wrap gap-x-3 gap-y-4">
      {picks.map((pick) => (
        <li key={pick.title.id} className="w-[4.25rem] sm:w-[4.75rem]">
          <div className="relative">
            <ImdbLink title={pick.title} className="block">
              <Poster title={pick.title} className="w-full" />
            </ImdbLink>
            <span
              className="tnum absolute -left-1 -top-1 grid h-[1.35rem] min-w-[1.35rem] place-items-center rounded-full px-1 font-mono text-[0.7rem] font-medium leading-none text-ink ring-2 ring-ink"
              style={{ background: rankColor(pick.rank, maxPicks) }}
            >
              {pick.rank}
            </span>
          </div>

          {/* Keeps the full name reachable when it truncates and the title has
              no IMDb id to hang a link tooltip off. */}
          <p
            className="mt-1.5 truncate text-[0.7rem] leading-tight"
            title={pick.title.name}
          >
            <ImdbLink
              title={pick.title}
              className="underline-offset-2 transition-colors hover:text-tungsten hover:underline"
            >
              {pick.title.name}
            </ImdbLink>
          </p>

          <GlobalPosition position={pick.globalPosition} />
        </li>
      ))}
    </ol>
  );
}

/** Where the crowd put it, against where you did. */
function GlobalPosition({ position }: { position: number | null }) {
  if (position === null) {
    return (
      <p
        className="tnum mt-0.5 font-mono text-[0.65rem] text-dim/70"
        title="Not on the board yet — it needs more ballots before it counts."
      >
        unranked
      </p>
    );
  }
  return (
    <p className="tnum mt-0.5 font-mono text-[0.65rem] text-dim">
      global #{position}
    </p>
  );
}
