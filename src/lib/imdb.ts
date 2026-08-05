/**
 * IMDb has no API we can use — see the note at the top of `tmdb.ts` — but its
 * title URLs are stable and derivable from the id TMDB gives us, so linking out
 * for the full record (cast, trivia, reviews) costs nothing and keeps this site
 * to the one job it does well: counting ballots.
 */
export function imdbUrl(imdbId: string | null): string | null {
  return imdbId ? `https://www.imdb.com/title/${imdbId}/` : null;
}
