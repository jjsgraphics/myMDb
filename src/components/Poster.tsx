/** Kept free of server-only imports so the ballot builder can render posters
 *  on the client too. */
export type PosterTitle = {
  name: string;
  posterPath: string | null;
};

function posterUrl(path: string | null, size: "w342" | "w500") {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
}

/** Deterministic hue per title, so the drawn fallback is stable between
 *  renders and two titles rarely collide side by side. */
function hue(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

function initials(name: string) {
  return name
    .replace(/^(the|a|an)\s+/i, "")
    .split(/[\s:]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * A poster, or a drawn stand-in when TMDB has not been wired up yet. The
 * fallback is designed rather than broken — an unconfigured install still looks
 * deliberate.
 */
export function Poster({
  title,
  className = "",
  sizes = "w342",
}: {
  title: PosterTitle;
  className?: string;
  sizes?: "w342" | "w500";
}) {
  const src = posterUrl(title.posterPath, sizes);
  const base =
    "relative overflow-hidden rounded-[3px] bg-raised ring-1 ring-line/80 " +
    "aspect-[2/3] shrink-0";

  if (src) {
    return (
      <div className={`${base} ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  const h = hue(title.name);
  return (
    <div
      className={`${base} ${className} grid place-items-center`}
      style={{
        background: `linear-gradient(155deg,
          hsl(${h} 24% 22%) 0%,
          hsl(${(h + 40) % 360} 20% 12%) 100%)`,
      }}
      aria-hidden
    >
      <span
        className="font-display text-bone/35 leading-none"
        style={{ fontSize: "clamp(0.9rem, 2.2cqw + 0.7rem, 2rem)" }}
      >
        {initials(title.name)}
      </span>
    </div>
  );
}
