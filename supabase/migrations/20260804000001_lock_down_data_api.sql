-- Close the Data API on every application table.
--
-- Why this matters here specifically: this app's entire premise is that one
-- person gets one ballot per category. All of that is enforced in the Next.js
-- route handler and by a unique constraint. None of it is enforced by Postgres
-- permissions.
--
-- Supabase also publishes the `public` schema through PostgREST at
-- /rest/v1/<table>. If the anon role can reach these tables, anybody with the
-- publishable key — which ships to every browser — can insert straight into
-- `ballots` and `ballot_entries` and manufacture as many votes as they like,
-- never touching the API that does the checking. The leaderboard is then
-- meaningless.
--
-- The app connects over a direct Postgres connection as the `postgres` role,
-- which has BYPASSRLS, so enabling RLS with no policies costs the app nothing
-- and denies the Data API everything. That asymmetry is the whole trick.
--
-- If you later want to read boards from the browser via supabase-js, add a
-- narrow SELECT policy to `standings`, `titles` and `categories` only. Never
-- add write policies to `ballots` or `ballot_entries` — writes must keep going
-- through /api/ballot so the one-ballot rule and the ranking validation run.

alter table public.users               enable row level security;
alter table public.accounts            enable row level security;
alter table public.sessions            enable row level security;
alter table public.verification_tokens enable row level security;
alter table public.categories          enable row level security;
alter table public.titles              enable row level security;
alter table public.ballots             enable row level security;
alter table public.ballot_entries      enable row level security;
alter table public.standings           enable row level security;

-- Defense in depth: RLS is the gate, but there is no reason for the API roles
-- to hold table privileges in the first place.
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;

-- Tables created later (a new Drizzle push) must not silently re-open.
alter default privileges in schema public
  revoke all on tables from anon, authenticated;
alter default privileges in schema public
  revoke all on sequences from anon, authenticated;
