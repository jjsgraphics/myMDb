"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Poster } from "./Poster";
import { rankColor } from "@/lib/rank-color";
import { pointsForRank } from "@/lib/scoring";
import type { SearchItem } from "@/app/api/search/route";

export type Pick = {
  key: string;
  titleId: string | null;
  tmdbId: number | null;
  mediaType: "movie" | "tv";
  name: string;
  year: number | null;
  posterPath: string | null;
};

type Status =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "error"; message: string };

export function BallotBuilder({
  slug,
  maxPicks,
  kind,
  initialPicks,
  canSubmit,
  isDemo,
}: {
  slug: string;
  maxPicks: number;
  kind: "movie" | "tv" | "any";
  initialPicks: Pick[];
  canSubmit: boolean;
  isDemo: boolean;
}) {
  const router = useRouter();
  const [picks, setPicks] = useState<Pick[]>(initialPicks);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const dragFrom = useRef<number | null>(null);

  const full = picks.length >= maxPicks;
  const chosen = new Set(picks.map((p) => p.key));

  /* Debounced search. The abort controller stops a slow early request from
     overwriting the results of a later one. */
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&kind=${kind}`,
          { signal: controller.signal },
        );
        const data = await res.json();
        setResults(data.items ?? []);
      } catch {
        /* aborted or offline — leave the previous results in place */
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, kind]);

  function add(item: SearchItem) {
    if (full || chosen.has(item.key)) return;
    setPicks((prev) => [
      ...prev,
      {
        key: item.key,
        titleId: item.titleId,
        tmdbId: item.tmdbId,
        mediaType: item.mediaType,
        name: item.name,
        year: item.year,
        posterPath: item.posterPath,
      },
    ]);
    setStatus({ kind: "idle" });
    setQuery("");
    setResults([]);
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= picks.length || from === to) return;
    setPicks((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
    setStatus({ kind: "idle" });
  }

  function remove(index: number) {
    setPicks((prev) => prev.filter((_, i) => i !== index));
    setStatus({ kind: "idle" });
  }

  async function submit() {
    setStatus({ kind: "saving" });
    const res = await fetch("/api/ballot", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug, picks }),
    });
    if (res.ok) {
      setStatus({ kind: "saved" });
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setStatus({
        kind: "error",
        message: data.error ?? "Could not save that ballot. Try again.",
      });
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      {/* ---- The ballot ---- */}
      <section>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="eyebrow">Your ballot</h2>
          <span className="tnum font-mono text-xs text-dim">
            {picks.length} / {maxPicks}
          </span>
        </div>

        <ol className="mt-3">
          {Array.from({ length: maxPicks }, (_, i) => {
            const pick = picks[i];
            const rank = i + 1;
            const colour = rankColor(rank, maxPicks);

            if (!pick) {
              return (
                <li
                  key={`empty-${rank}`}
                  className="flex items-center gap-3 border-b border-line/40 py-2.5 opacity-45"
                >
                  <span className="tnum w-6 text-right font-mono text-sm text-dim">
                    {rank}
                  </span>
                  <span className="h-9 w-6 rounded-[2px] border border-dashed border-line" />
                  <span className="text-sm text-dim">Empty</span>
                  <span className="tnum ml-auto font-mono text-xs text-dim">
                    {pointsForRank(rank, maxPicks)} pts
                  </span>
                </li>
              );
            }

            return (
              <li
                key={pick.key}
                draggable
                onDragStart={() => (dragFrom.current = i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragFrom.current !== null) move(dragFrom.current, i);
                  dragFrom.current = null;
                }}
                className="flex cursor-grab items-center gap-3 border-b border-line/40 py-2.5 active:cursor-grabbing"
              >
                <span
                  className="tnum w-6 text-right font-mono text-sm"
                  style={{ color: colour }}
                >
                  {rank}
                </span>

                <Poster title={pick} className="w-6" />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{pick.name}</p>
                  <p className="eyebrow">
                    {pick.mediaType === "tv" ? "Series" : "Film"}
                    {pick.year ? ` · ${pick.year}` : ""}
                  </p>
                </div>

                <span
                  className="tnum font-mono text-xs"
                  style={{ color: colour }}
                >
                  {pointsForRank(rank, maxPicks)} pts
                </span>

                <div className="flex items-center gap-0.5">
                  <IconButton
                    label={`Move ${pick.name} up`}
                    disabled={i === 0}
                    onClick={() => move(i, i - 1)}
                  >
                    ↑
                  </IconButton>
                  <IconButton
                    label={`Move ${pick.name} down`}
                    disabled={i === picks.length - 1}
                    onClick={() => move(i, i + 1)}
                  >
                    ↓
                  </IconButton>
                  <IconButton
                    label={`Remove ${pick.name}`}
                    onClick={() => remove(i)}
                  >
                    ×
                  </IconButton>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            onClick={submit}
            disabled={!canSubmit || picks.length === 0 || status.kind === "saving"}
            className="rounded-full bg-tungsten px-5 py-2.5 text-sm font-semibold text-ink transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {status.kind === "saving" ? "Saving…" : "Submit ballot"}
          </button>

          {status.kind === "saved" && (
            <p className="text-sm text-stock" role="status">
              Counted. The board is updated.
            </p>
          )}
          {status.kind === "error" && (
            <p className="text-sm text-tungsten" role="alert">
              {status.message}
            </p>
          )}
          {isDemo && status.kind === "idle" && (
            <p className="text-sm text-dim">
              Demo mode — this ballot lives in memory until you connect a
              database.
            </p>
          )}
        </div>
      </section>

      {/* ---- Search ---- */}
      <section className="rounded-lg border border-line/70 bg-surface/50 p-4">
        <h2 className="eyebrow">Add a title</h2>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            kind === "tv"
              ? "Search series…"
              : kind === "movie"
                ? "Search films…"
                : "Search films and series…"
          }
          disabled={full}
          className="mt-3 w-full rounded border border-line bg-ink px-3 py-2 text-sm placeholder:text-dim/70 focus:border-tungsten focus:outline-none disabled:opacity-50"
        />

        {full ? (
          <p className="mt-3 text-sm text-dim">
            Ballot is full. Remove a pick to swap something in.
          </p>
        ) : searching ? (
          <p className="eyebrow mt-3">Searching…</p>
        ) : results.length ? (
          <ul className="mt-3 max-h-96 space-y-1 overflow-y-auto">
            {results.map((item) => {
              const already = chosen.has(item.key);
              return (
                <li key={item.key}>
                  <button
                    onClick={() => add(item)}
                    disabled={already}
                    className="flex w-full items-center gap-2.5 rounded px-1.5 py-1.5 text-left transition-colors hover:bg-raised disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    <Poster title={item} className="w-7" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{item.name}</span>
                      <span className="eyebrow">
                        {item.mediaType === "tv" ? "Series" : "Film"}
                        {item.year ? ` · ${item.year}` : ""}
                      </span>
                    </span>
                    <span className="text-dim">{already ? "✓" : "+"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : query.trim().length >= 2 ? (
          <p className="mt-3 text-sm text-dim">Nothing matched that.</p>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-dim">
            Order matters. Drag a row, or use the arrows, to move something up.
          </p>
        )}
      </section>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="grid h-6 w-6 place-items-center rounded text-dim transition-colors hover:bg-raised hover:text-bone disabled:opacity-25 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}
