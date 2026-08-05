"use client";

/**
 * Last resort: an error thrown in the root layout itself, where `error.tsx`
 * cannot help because the layout that would frame it is the thing that failed.
 *
 * This replaces the whole document, so it ships its own html/body and inline
 * styles — globals.css is not guaranteed to have loaded at this point.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          background: "#0b0e14",
          color: "#e9e5dc",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: "32rem" }}>
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span style={{ fontSize: "1.35rem", fontWeight: 800 }}>MyM</span>
            <span style={{ fontSize: "1.35rem", fontWeight: 800, color: "#ffae3b" }}>
              Db
            </span>
          </div>

          <h1
            style={{
              marginTop: "1.5rem",
              fontSize: "2rem",
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            The site failed to load.
          </h1>
          <p style={{ marginTop: "1rem", lineHeight: 1.6, color: "#79839a" }}>
            This one is on us, not on you. Reloading usually clears it.
          </p>

          <button
            onClick={reset}
            style={{
              marginTop: "2rem",
              border: 0,
              borderRadius: "9999px",
              background: "#ffae3b",
              color: "#0b0e14",
              padding: "0.7rem 1.3rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload
          </button>

          {error.digest ? (
            <p style={{ marginTop: "2.5rem", fontSize: "0.75rem", color: "#79839a" }}>
              Reference {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
