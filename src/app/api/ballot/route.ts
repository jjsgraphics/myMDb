import { NextResponse, type NextRequest } from "next/server";
import { getCategory, ensureTitle, submitBallot } from "@/lib/store";
import { validateBallot } from "@/lib/scoring";
import { getViewer } from "@/lib/viewer";

type Pick = {
  titleId?: string | null;
  tmdbId?: number | null;
  mediaType?: "movie" | "tv";
  name?: string;
  year?: number | null;
  posterPath?: string | null;
};

/**
 * Accept a ranked list. The picks arrive in order — array position is the rank,
 * so the client never has to send rank numbers that could disagree with the
 * order on screen.
 */
export async function POST(req: NextRequest) {
  const viewer = await getViewer();
  if (!viewer) {
    return NextResponse.json(
      { error: "Sign in to submit a ballot." },
      { status: 401 },
    );
  }

  let payload: { slug?: string; picks?: Pick[] };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const { slug, picks } = payload;
  if (!slug || !Array.isArray(picks)) {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const category = await getCategory(slug);
  if (!category) {
    return NextResponse.json({ error: "No such category." }, { status: 404 });
  }

  // Resolve any TMDB picks into stored titles before validating, so the
  // duplicate check sees the same id for the same film twice.
  const titleIds: string[] = [];
  for (const pick of picks.slice(0, category.maxPicks)) {
    if (pick.titleId) {
      titleIds.push(pick.titleId);
      continue;
    }
    if (pick.tmdbId && pick.mediaType && pick.name) {
      const title = await ensureTitle({
        tmdbId: pick.tmdbId,
        mediaType: pick.mediaType,
        name: pick.name,
        year: pick.year ?? null,
        posterPath: pick.posterPath ?? null,
      });
      titleIds.push(title.id);
      continue;
    }
    return NextResponse.json(
      { error: "One of the picks is missing its title." },
      { status: 400 },
    );
  }

  const problem = validateBallot(titleIds, category.maxPicks);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  await submitBallot(viewer.id, category.id, titleIds);

  return NextResponse.json({ ok: true, counted: titleIds.length });
}
