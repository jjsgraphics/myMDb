import type { NextRequest } from "next/server";

/**
 * Fixed-window rate limiting, held in process memory.
 *
 * Read this before trusting it: the counter lives in one server instance, so
 * under Vercel's Fluid Compute the effective ceiling is roughly the limit
 * multiplied by however many instances are warm. It stops a script hammering
 * one endpoint in a loop — which is the realistic abuse here, someone draining
 * the TMDB key — and it does not stop a distributed attack.
 *
 * The proper fix is Vercel's WAF rate limiting, which runs at the edge before a
 * function is ever invoked, or a shared Redis counter. This is the version that
 * needs no provisioning and can ship today, not a replacement for either.
 */
type Bucket = { count: number; resetAt: number };

// Survives hot reloads in dev, and instance reuse in production.
const globalForLimit = globalThis as unknown as { __rateLimit?: Map<string, Bucket> };
const buckets: Map<string, Bucket> = (globalForLimit.__rateLimit ??= new Map());

export type RateLimitResult = {
  ok: boolean;
  /** Seconds until the window resets. Only meaningful when `ok` is false. */
  retryAfter: number;
};

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    // Sweep expired keys occasionally so a long-lived instance cannot grow this
    // map without bound off the back of unique client addresses.
    if (buckets.size > 10_000) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfter: 0 };
}

/**
 * A per-caller bucket key.
 *
 * Prefers a stable identity (a signed-in user id) over an address, because
 * shared IPs are common — a university or a mobile carrier behind CGNAT can put
 * thousands of people on one address, and limiting them as a single caller
 * would lock out real voters.
 */
export function limitKey(req: NextRequest, scope: string, userId?: string) {
  if (userId) return `${scope}:user:${userId}`;
  // Set by the platform on Vercel; the leftmost entry is the client.
  const ip =
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  return `${scope}:ip:${ip}`;
}

/** Standard 429 headers, so well-behaved clients back off on their own. */
export function retryHeaders(retryAfter: number): Record<string, string> {
  return { "Retry-After": String(retryAfter) };
}
