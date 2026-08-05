import { imdbUrl } from "@/lib/imdb";
import type { Title } from "@/lib/store";

/**
 * Wraps anything that should send people to IMDb for the full record — cast,
 * runtime, reviews — none of which this site stores or wants to.
 *
 * Renders its children bare when the title has no IMDb id, which is every title
 * until `npm run enrich` has backfilled them. That keeps the board working on a
 * fresh install instead of showing dead links.
 */
export function ImdbLink({
  title,
  className = "",
  children,
}: {
  title: Title;
  className?: string;
  children: React.ReactNode;
}) {
  const href = imdbUrl(title.imdbId);
  if (!href) return <>{children}</>;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className={className}
      title={`${title.name} on IMDb`}
    >
      {children}
    </a>
  );
}
