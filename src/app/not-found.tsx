import Link from "next/link";

/** 404. Reached by `notFound()` in the category routes when a slug does not
 *  exist — including old links to a category that has since been retired. */
export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-5 pt-24 pb-16">
      <p className="eyebrow">404</p>
      <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
        No such page.
      </h1>
      <p className="mt-4 text-[0.95rem] leading-relaxed text-dim">
        The category may have been retired, or the link may be wrong. Every
        active board is listed on the front page.
      </p>

      <Link
        href="/"
        className="mt-8 inline-block rounded-full bg-tungsten px-5 py-2.5 text-sm font-semibold text-ink transition-opacity hover:opacity-90"
      >
        All categories
      </Link>
    </div>
  );
}
