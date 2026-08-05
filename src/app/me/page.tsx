import Link from "next/link";
import { MyPicks } from "@/components/MyPicks";
import { getMyLists } from "@/lib/store";
import { getViewer } from "@/lib/viewer";
import { authConfigured } from "@/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Your lists — MyMDb",
};

export default async function ProfilePage() {
  const viewer = await getViewer();

  if (!viewer) {
    return (
      <div className="mx-auto max-w-4xl px-5">
        <header className="pt-14 pb-8">
          <h1 className="font-display text-4xl font-extrabold leading-none tracking-tight sm:text-5xl">
            Your lists
          </h1>
          <p className="mt-5 max-w-xl rounded border border-line bg-surface/60 px-4 py-3 text-sm text-dim">
            {authConfigured ? (
              <>
                <Link href="/signin" className="text-tungsten hover:underline">
                  Sign in
                </Link>{" "}
                to see every ballot you have cast, in one place.
              </>
            ) : (
              <>
                Ballots belong to accounts, and sign-in is not configured yet.
                Add a Google or Discord provider to{" "}
                <code className="font-mono text-stock">.env</code> to open
                voting — then your lists collect here.
              </>
            )}
          </p>
        </header>
      </div>
    );
  }

  const lists = await getMyLists(viewer.id);
  const ranked = lists.filter((l) => l.picks.length > 0);
  const empty = lists.filter((l) => l.picks.length === 0);
  const totalPicks = ranked.reduce((n, l) => n + l.picks.length, 0);

  return (
    <div className="mx-auto max-w-4xl px-5">
      <header className="pt-14 pb-8">
        <p className="eyebrow">
          {ranked.length} of {lists.length}{" "}
          {lists.length === 1 ? "category" : "categories"} ranked ·{" "}
          {totalPicks} {totalPicks === 1 ? "pick" : "picks"}
        </p>

        <h1 className="mt-5 font-display text-4xl font-extrabold leading-none tracking-tight sm:text-5xl">
          {viewer.name}
        </h1>

        {viewer.isDemo ? (
          <p className="mt-5 max-w-xl rounded border border-line bg-surface/60 px-4 py-3 text-sm text-dim">
            This is a demo identity tied to your browser, not an account. These
            lists live in memory and are not counted into the public boards.
          </p>
        ) : (
          <p className="mt-4 max-w-xl text-[0.95rem] leading-relaxed text-dim">
            Every ballot you have cast. Each one is editable — changing a list
            replaces it, so you never get a second vote.
          </p>
        )}
      </header>

      {ranked.length === 0 ? (
        <p className="rule py-16 text-center text-dim">
          You have not ranked anything yet.{" "}
          <Link
            href={`/c/${lists[0]?.category.slug ?? ""}/rank`}
            className="text-tungsten hover:underline"
          >
            Start with {lists[0]?.category.name ?? "a category"}
          </Link>
          .
        </p>
      ) : (
        <ul className="rule">
          {ranked.map(({ category, picks }) => (
            <li key={category.id} className="border-b border-line/50 py-7">
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                <h2 className="font-display text-xl font-bold leading-tight tracking-tight">
                  <Link
                    href={`/c/${category.slug}`}
                    className="transition-colors hover:text-tungsten"
                  >
                    {category.name}
                  </Link>
                </h2>

                <div className="flex items-center gap-4">
                  <span className="eyebrow">
                    {picks.length} of {category.maxPicks}
                  </span>
                  <Link
                    href={`/c/${category.slug}/rank`}
                    className="text-sm text-stock underline-offset-2 hover:underline"
                  >
                    Edit list
                  </Link>
                </div>
              </div>

              <div className="mt-5">
                <MyPicks picks={picks} maxPicks={category.maxPicks} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {empty.length > 0 && (
        <section className="py-10">
          <h2 className="eyebrow">Not ranked yet</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {empty.map(({ category }) => (
              <li key={category.id}>
                <Link
                  href={`/c/${category.slug}/rank`}
                  className="inline-block rounded-full border border-line px-4 py-2 text-sm text-dim transition-colors hover:border-tungsten/40 hover:text-bone"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
