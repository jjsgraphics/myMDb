/**
 * One scale, used everywhere a rank appears: tungsten at first pick, cooling to
 * film-stock cyan at last. Because it is consistent across the ballot builder,
 * the spine and the leaderboard, colour alone tells you where on a ballot
 * something sat.
 */
const TUNGSTEN = [255, 174, 59] as const;
const STOCK = [88, 199, 216] as const;

export function rankColor(rank: number, maxPicks: number): string {
  const t = maxPicks <= 1 ? 0 : (Math.min(rank, maxPicks) - 1) / (maxPicks - 1);
  const [r, g, b] = TUNGSTEN.map((c, i) => Math.round(c + (STOCK[i] - c) * t));
  return `rgb(${r} ${g} ${b})`;
}
