/**
 * Ballot aggregation.
 *
 * Every voter submits a ranked list; we convert ranks to points and sum them.
 * This is a Borda count — the same method the Sight & Sound critics' poll uses
 * — and it is deliberately linear so the rule fits in one sentence on the page:
 * in a top-10 category your first pick is worth 10 points and your tenth is
 * worth 1.
 *
 * The alternative, averaging star ratings, answers a different question. It
 * tells you what is broadly liked. Points from ranked ballots tell you what
 * people actually put at the top when forced to choose, which is the question
 * this site exists to ask.
 */

export type BallotRow = { titleId: string; rank: number };

export type Standing = {
  titleId: string;
  points: number;
  ballotCount: number;
  /** rankCounts[i] = voters who placed this title at rank i+1. */
  rankCounts: number[];
  position: number;
};

/** Points awarded for a given 1-indexed rank on a ballot of `maxPicks` slots. */
export function pointsForRank(rank: number, maxPicks: number): number {
  if (rank < 1 || rank > maxPicks) return 0;
  return maxPicks - rank + 1;
}

/**
 * Fold every ballot entry in a category into an ordered leaderboard.
 *
 * `minBallots` keeps a title off the board until enough different people have
 * named it. One person with strong opinions should not be able to mint a #1,
 * and without this guard the long tail of single-vote obscurities outranks
 * anything with genuine consensus behind it.
 */
export function computeStandings(
  entries: BallotRow[],
  opts: { maxPicks: number; minBallots: number },
): Standing[] {
  const { maxPicks, minBallots } = opts;
  const acc = new Map<string, { points: number; rankCounts: number[] }>();

  for (const { titleId, rank } of entries) {
    if (rank < 1 || rank > maxPicks) continue;
    let row = acc.get(titleId);
    if (!row) {
      row = { points: 0, rankCounts: new Array(maxPicks).fill(0) };
      acc.set(titleId, row);
    }
    row.points += pointsForRank(rank, maxPicks);
    row.rankCounts[rank - 1] += 1;
  }

  const rows = [...acc.entries()]
    .map(([titleId, { points, rankCounts }]) => ({
      titleId,
      points,
      rankCounts,
      ballotCount: rankCounts.reduce((a, b) => a + b, 0),
    }))
    .filter((r) => r.ballotCount >= minBallots);

  rows.sort(
    (a, b) =>
      b.points - a.points ||
      b.ballotCount - a.ballotCount ||
      // Still tied: whoever more people put at #1 goes first.
      b.rankCounts[0] - a.rankCounts[0] ||
      a.titleId.localeCompare(b.titleId),
  );

  return rows.map((r, i) => ({ ...r, position: i + 1 }));
}

/**
 * Reject a ballot before it reaches the database.
 *
 * Returns null when the ballot is fine, or a message written for the person
 * who submitted it.
 */
export function validateBallot(
  titleIds: string[],
  maxPicks: number,
): string | null {
  if (titleIds.length === 0) return "Add at least one pick before submitting.";
  if (titleIds.length > maxPicks)
    return `This category takes ${maxPicks} picks at most.`;
  if (new Set(titleIds).size !== titleIds.length)
    return "The same title appears twice. Each pick has to be different.";
  return null;
}
