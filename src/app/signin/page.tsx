import { redirect } from "next/navigation";
import { signIn, authConfigured, googleReady, discordReady } from "@/auth";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export default async function SignInPage() {
  const viewer = await getViewer();
  if (viewer && !viewer.isDemo) redirect("/");

  const providers = [
    googleReady ? { id: "google", label: "Continue with Google" } : null,
    discordReady ? { id: "discord", label: "Continue with Discord" } : null,
  ].filter((p): p is { id: string; label: string } => Boolean(p));

  return (
    <div className="mx-auto max-w-md px-5 pt-24">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">
        Sign in to vote
      </h1>
      <p className="mt-4 text-[0.95rem] leading-relaxed text-dim">
        An account is what makes one ballot per person possible. We store your
        name, email and avatar from the provider you choose, and nothing else.
      </p>

      {authConfigured ? (
        <div className="mt-8 space-y-3">
          {providers.map((provider) => (
            <form
              key={provider.id}
              action={async () => {
                "use server";
                await signIn(provider.id, { redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="w-full rounded border border-line bg-surface px-4 py-3 text-sm font-medium transition-colors hover:border-tungsten/50 hover:bg-raised"
              >
                {provider.label}
              </button>
            </form>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded border border-line bg-surface/60 p-4 text-sm leading-relaxed text-dim">
          <p className="text-bone">Sign-in is not configured yet.</p>
          <p className="mt-2">
            Set <code className="font-mono text-stock">DATABASE_URL</code> plus
            at least one provider pair —{" "}
            <code className="font-mono text-stock">AUTH_GOOGLE_ID</code> /{" "}
            <code className="font-mono text-stock">AUTH_GOOGLE_SECRET</code> or
            the Discord equivalents — then restart. Until then the site runs in
            demo mode and ballots are per-browser.
          </p>
        </div>
      )}
    </div>
  );
}
