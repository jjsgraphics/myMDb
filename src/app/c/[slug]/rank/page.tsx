import Link from "next/link";
import { notFound } from "next/navigation";
import { BallotBuilder, type Pick } from "@/components/BallotBuilder";
import { getCategory, getMyBallot } from "@/lib/store";
import { getViewer } from "@/lib/viewer";
import { authConfigured } from "@/auth";

export const dynamic = "force-dynamic";

export default async function RankPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();

  const viewer = await getViewer();
  const existing = viewer ? await getMyBallot(viewer.id, category.id) : [];

  const initialPicks: Pick[] = existing.map((t) => ({
    key: `local:${t.id}`,
    titleId: t.id,
    tmdbId: null,
    mediaType: t.mediaType,
    name: t.name,
    year: t.year,
    posterPath: t.posterPath,
  }));

  return (
    <div className="mx-auto max-w-5xl px-5">
      <header className="pt-14 pb-8">
        <Link
          href={`/c/${category.slug}`}
          className="eyebrow transition-colors hover:text-bone"
        >
          ← {category.name} board
        </Link>

        <h1 className="mt-5 font-display text-3xl font-extrabold leading-none tracking-tight sm:text-4xl">
          Your top {category.maxPicks}
        </h1>
        <p className="mt-4 max-w-xl text-[0.95rem] leading-relaxed text-dim">
          {category.blurb}
        </p>

        {existing.length > 0 && (
          <p className="mt-4 text-sm text-stock">
            You already have a ballot here. Editing it replaces your old one —
            you never get a second vote.
          </p>
        )}

        {!viewer && (
          <p className="mt-5 rounded border border-line bg-surface/60 px-4 py-3 text-sm text-dim">
            {authConfigured ? (
              <>
                <Link href="/signin" className="text-tungsten hover:underline">
                  Sign in
                </Link>{" "}
                to submit. Building a list without an account is fine — it just
                will not be counted.
              </>
            ) : (
              <>
                Voting is closed until sign-in is configured. Ballots have to
                belong to an account, or one list per person means nothing — add
                a Google or Discord provider to{" "}
                <code className="font-mono text-stock">.env</code> to open it.
                You can still build a list here.
              </>
            )}
          </p>
        )}
      </header>

      <BallotBuilder
        slug={category.slug}
        maxPicks={category.maxPicks}
        kind={category.kind}
        initialPicks={initialPicks}
        canSubmit={Boolean(viewer)}
        isDemo={viewer?.isDemo ?? false}
      />
    </div>
  );
}
