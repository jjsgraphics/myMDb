# MyMDb

Everyone submits a ranked top ten. Every ballot is counted into one public board.

Star ratings measure tolerance — a 7/10 average tells you a lot of people
thought something was fine. Ranked ballots measure conviction: what people put
at the top when forced to choose. This site only asks the second question, and
it asks it per category, so "funniest" and "best edited" are separate polls with
separate winners.

## Run it now

```bash
npm install
npm run dev
```

That works on a fresh clone with no database, no API key and no OAuth app. The
site starts in **demo mode**: categories and a title pool come from
`src/lib/seed-data.ts`, the boards are populated with synthetic ballots so there
is something to look at, and your submissions are held in server memory until
the process restarts. Posters are drawn locally rather than fetched.

Demo mode is for looking around. Everything below turns it into a real site.

## Going real

### 1. Database — Supabase

Vercel no longer sells a database of its own; you host the *app* on Vercel and
bring your own Postgres. This project uses [Supabase](https://supabase.com).

Two connection strings, both from **Project → Connect** in the dashboard. They
are not interchangeable:

```bash
# .env

# Pooled — the running app. Supavisor transaction mode, port 6543.
DATABASE_URL="postgresql://postgres.PROJECTREF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres"

# Direct — schema changes only. Port 5432.
DIRECT_URL="postgresql://postgres:PASSWORD@db.PROJECTREF.supabase.co:5432/postgres"
```

Serverless functions open many short-lived connections and would exhaust
Postgres directly, so the app goes through the pooler. Transaction mode cannot
support prepared statements, so [`src/db/index.ts`](src/db/index.ts) detects the
pooler hostname and disables them — without that you get
`prepared statement already exists` errors that only appear under concurrency.

Migrations need a real session, so they use `DIRECT_URL`. That host is IPv6-only
unless you have Supabase's IPv4 add-on; on an IPv4-only network use the *session*
pooler (same pooler host, port 5432) for `DIRECT_URL` instead.

```bash
npm run db:push    # create the tables
npm run db:seed    # load the starter categories and title pool
```

Then apply the Data API lockdown — **do not skip this**:

```bash
npx supabase link --project-ref PROJECTREF
npx supabase db push
```

Or paste [`supabase/migrations/20260804000001_lock_down_data_api.sql`](supabase/migrations/20260804000001_lock_down_data_api.sql)
into the dashboard SQL editor.

Supabase publishes the `public` schema over REST at `/rest/v1/<table>`. Without
that migration, anyone holding the publishable key — which ships to every
browser — can `POST` straight into `ballots` and invent as many votes as they
want, never touching the API that enforces one-ballot-per-person. The migration
enables RLS with no policies and revokes the API roles' privileges. The app is
unaffected because it connects as `postgres`, which has `BYPASSRLS`.

The moment `DATABASE_URL` is set, `src/lib/store.ts` switches every read and
write from the in-memory store to Postgres. No other code changes.

### 2. Sign-in — and the one-list-per-person problem

**Do not do this in the browser.** localStorage, a cookie, a device id, a
fingerprint — all of it is defeated by an incognito window, which is roughly ten
seconds of effort. If ballot integrity matters at all, identity has to live on
the server.

This project uses OAuth via Auth.js, with Google and Discord. Google covers
almost everyone; Discord is where film and TV communities already are, so it is
the one people will actually recognise on a site like this. Add either, or both:

```bash
AUTH_SECRET=""              # npx auth secret
AUTH_URL="http://localhost:3000"
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
AUTH_DISCORD_ID=""
AUTH_DISCORD_SECRET=""
```

Redirect URIs are `/api/auth/callback/google` and `/api/auth/callback/discord`.

The rule itself is not enforced in application code, where a double-click or two
open tabs could race past it. It is a unique constraint in Postgres:

```
unique("one_ballot_per_user_per_category").on(t.userId, t.categoryId)
```

A second submission updates the existing row instead of inserting a new one, so
people can revise their list forever and still only ever have one live ballot.

Worth being honest about the ceiling: OAuth stops casual double-voting, not a
determined person with five Gmail accounts. That is the right trade for now — it
costs users one click and costs an attacker real effort. If a category ever gets
brigaded, the next lever is a minimum account age plus rate limiting, not
tighter identity checks.

### 3. Title data — TMDB, not IMDb

IMDb has no usable API. The official one ships through AWS Data Exchange at
enterprise pricing (six figures a year), which rules it out. Everyone in this
space — Series Graph included — runs on
[TMDB](https://www.themoviedb.org/settings/api): free for non-commercial use
with attribution, posters included, and every record carries its IMDb id so
linking out still works. If you later monetise the site, TMDB requires a
commercial licence.

```bash
TMDB_API_KEY=""   # v3 key or v4 read token, both work
```

```bash
npm run enrich    # backfills tmdb ids and poster paths for seeded titles
```

Without a key, search falls back to titles already in your database and posters
fall back to drawn tiles. Nothing breaks.

### 4. Admin

```bash
ADMIN_EMAILS="you@example.com"
```

`/admin` lets you add, rename, retune and retire categories. Changing a
category's ballot length or qualifying threshold re-counts every existing ballot
against the new settings.

### 5. Deploy

```bash
vercel login
vercel link                          # creates .vercel/project.json

node scripts/push-env.mjs            # dry run — shows what will be sent
node scripts/push-env.mjs --run      # push .env to all three environments

vercel deploy                        # preview build, prints a URL
```

`vercel env add` takes **one** environment per call and reads the value from
stdin, so [`scripts/push-env.mjs`](scripts/push-env.mjs) loops it for you.
It deliberately skips two keys:

- `DIRECT_URL` — only drizzle-kit and the seed/enrich scripts use it, and those
  run on your machine. The deployed app never reads it. Leaving it out also
  sidesteps the direct host being IPv6-only.
- `AUTH_URL` — must differ per environment, so set it once you know the domain.

Then close the OAuth loop, which is circular by nature: you need the deployed
URL before you can register it.

```bash
vercel env add AUTH_URL production    # paste https://your-domain.com
vercel deploy --prod
```

Add `https://your-domain.com/api/auth/callback/google` to the Google OAuth
client alongside the localhost one. Until that exists, production sign-in fails
with `redirect_uri_mismatch` while localhost keeps working.

**Preview deployments get a new URL every push**, so OAuth will not work on them
unless you register each one. Test sign-in on production or on a stable alias.

[`vercel.ts`](vercel.ts) pins the function region to `lhr1` to sit next to the
Supabase project in `eu-west-2`. Every request makes several Postgres round
trips, so a cross-continent hop between function and database costs more than
everything else combined.

## How a score is built

Rank one is worth ten points, rank ten is worth one — a Borda count, the same
method the Sight & Sound critics' poll uses. It is deliberately linear so the
rule fits on the page in one sentence.

A title stays off the board until enough different people have named it
(`minBallots`, default 3). Without that, one enthusiastic voter mints a #1 and
the long tail of single-vote obscurities buries anything with real consensus
behind it.

### The consensus spine

Every board row carries a bar whose **length** is the title's points relative to
the leader, and whose **segments** are the points contributed by voters at each
rank, coloured amber at #1 cooling to cyan at #10.

That composition is the part a bare total hides. A film carried by a handful of
devoted first places shows a short, hot spine. One that almost everybody ranked
seventh shows a long, cool one. They can total identically and mean completely
different things — which is exactly the disagreement this site exists to
surface.

## Layout

```
src/
  app/
    page.tsx              category grid, points scale
    c/[slug]/page.tsx     the leaderboard
    c/[slug]/rank/        ballot builder
    admin/                category management
    api/search            TMDB search, falls back to local
    api/ballot            ballot submission
  lib/
    scoring.ts            Borda count and validation — pure, no I/O
    store.ts              every read and write; Postgres or in-memory
    tmdb.ts               TMDB client
    rank-color.ts         the amber-to-cyan rank scale
    viewer.ts             who is submitting, and who is an admin
  db/schema.ts            tables, including the one-ballot constraint
```

## Prior art

Nothing does quite this. [Ranker](https://www.ranker.com/) is upvote/downvote on
someone else's list rather than your own ranked ballot, and covers everything
rather than film and TV. [Flickchart](https://www.flickchart.com/) aggregates
head-to-head pairs, not top tens. [Letterboxd](https://letterboxd.com/) has
lists but never counts them into one board.
[Series Graph](https://seriesgraph.com/) — the look this borrows from — charts
episode ratings, which is a different question entirely.

The gap is the subjective category. Nobody is running a public, permanent
"funniest" or "best edited" poll where anyone can file a ballot and the board
moves. That is the whole product.

---

Title data and artwork from [TMDB](https://www.themoviedb.org/). This product
uses the TMDB API but is not endorsed or certified by TMDB.
