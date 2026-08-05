import Link from "next/link";

export const metadata = {
  title: "Privacy — MyMDb",
  description: "What MyMDb stores, why it stores it, and how to remove it.",
};

/**
 * Written against the actual schema rather than from a template. If the tables
 * in src/db/schema.ts change, this has to change with them — a privacy notice
 * that quietly stops matching what is stored is worse than none.
 */
export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 pt-14 pb-20">
      <Link href="/" className="eyebrow transition-colors hover:text-bone">
        ← All categories
      </Link>

      <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
        Privacy
      </h1>
      <p className="mt-4 leading-relaxed text-dim">
        MyMDb needs an account for exactly one reason: a ballot has to belong to
        somebody, or &ldquo;one list per person&rdquo; is unenforceable. That is
        the whole purpose of everything below.
      </p>

      <Section title="What is stored">
        <p>When you sign in with Google or Discord, we store:</p>
        <ul className="mt-3 space-y-2">
          <Item>
            Your <strong className="text-bone">name, email address and avatar
            URL</strong>, as your provider reports them.
          </Item>
          <Item>
            The <strong className="text-bone">access and refresh tokens</strong>{" "}
            your provider issues. These identify your account to us on your next
            visit. They are never shown to anyone and never sent to a third
            party.
          </Item>
          <Item>
            A <strong className="text-bone">session token</strong> in an
            httpOnly cookie, so you stay signed in.
          </Item>
          <Item>
            Your <strong className="text-bone">ballots</strong> — which titles
            you ranked, in which category, in what order, and when you last
            changed them.
          </Item>
        </ul>
        <p className="mt-4">
          There is no analytics, no advertising, and no third-party tracker on
          this site.
        </p>
      </Section>

      <Section title="What is public">
        <p>
          Your ballots are counted into the public boards, but they are published
          only as <em>totals</em> — points and how many people placed a title at
          each rank. Your name is never attached to a title in public, and no
          page lists an individual person&rsquo;s ballot except your own{" "}
          <Link href="/me" className="text-tungsten hover:underline">
            lists page
          </Link>
          , which only you can see.
        </p>
      </Section>

      <Section title="Who else is involved">
        <ul className="space-y-2">
          <Item>
            <strong className="text-bone">Google or Discord</strong>, whichever
            you sign in with. We receive your profile from them; they do not
            receive your ballots.
          </Item>
          <Item>
            <strong className="text-bone">TMDB</strong> supplies title data and
            artwork. Poster images load in your browser directly from
            image.tmdb.org, so TMDB can see those image requests. We send them no
            information about you.
          </Item>
          <Item>
            <strong className="text-bone">Vercel and Supabase</strong> host the
            site and the database.
          </Item>
        </ul>
      </Section>

      <Section title="How long it is kept">
        <p>
          Until you delete it. There is no scheduled purge, and no backup of your
          data is sold or shared.
        </p>
      </Section>

      <Section title="Removing it">
        <p>
          Open your{" "}
          <Link href="/me" className="text-tungsten hover:underline">
            lists page
          </Link>{" "}
          and use <span className="text-bone">Delete account</span>. It removes
          your account, your tokens and every ballot you have cast, and the
          boards are recounted without your votes immediately. It is irreversible
          — we keep no copy afterwards.
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-bold tracking-tight">{title}</h2>
      <div className="mt-3 leading-relaxed text-dim">{children}</div>
    </section>
  );
}

function Item({ children }: { children: React.ReactNode }) {
  return (
    <li className="border-l border-line pl-4">
      {children}
    </li>
  );
}
