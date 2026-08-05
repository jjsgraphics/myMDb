"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Route-level error boundary.
 *
 * Every page here is force-dynamic and talks to Postgres on each request, so a
 * connection blip is the realistic failure — and the default Next error screen
 * looks like a broken site rather than a busy one. `reset()` re-runs the render,
 * which is usually all a transient database error needs.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl px-5 pt-24 pb-16">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
        That did not load.
      </h1>
      <p className="mt-4 text-[0.95rem] leading-relaxed text-dim">
        The board is counted live from the database, so this is usually a
        momentary hiccup rather than anything you did. Try again.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-tungsten px-5 py-2.5 text-sm font-semibold text-ink transition-opacity hover:opacity-90"
        >
          Try again
        </button>
        <Link href="/" className="text-sm text-dim transition-colors hover:text-bone">
          Back to categories
        </Link>
      </div>

      {/* The digest is the only handle on the server-side log for this error.
          The message itself stays server-side, where it belongs. */}
      {error.digest ? (
        <p className="eyebrow mt-10">Reference {error.digest}</p>
      ) : null}
    </div>
  );
}
