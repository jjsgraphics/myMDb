import NextAuth, { type NextAuthConfig } from "next-auth";
import Discord from "next-auth/providers/discord";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db, schema } from "@/db";

/**
 * Sign-in exists for exactly one reason: a ballot has to belong to somebody, or
 * "one list per person" is unenforceable.
 *
 * Anything stored in the browser — localStorage, a cookie, a fingerprint — is
 * cleared by an incognito window. OAuth is not perfect (anyone can register a
 * second Google account) but it raises the cost of ballot-stuffing from "one
 * click" to "create and verify a new account", which is where it needs to be
 * for a site like this.
 *
 * Google covers most people; Discord covers the film and TV communities where
 * this kind of list gets shared. Add either or both — providers configure
 * themselves from env vars and the sign-in page only offers what is present.
 */
// Both halves or neither. A provider registered with an id but no secret looks
// available on the sign-in page and then fails at the token exchange, which is
// a much worse experience than simply not offering it.
export const googleReady = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);
export const discordReady = Boolean(
  process.env.AUTH_DISCORD_ID && process.env.AUTH_DISCORD_SECRET,
);

const providers: NextAuthConfig["providers"] = [];
if (googleReady) providers.push(Google);
if (discordReady) providers.push(Discord);

export const authConfigured = providers.length > 0 && Boolean(db);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: db
    ? DrizzleAdapter(db, {
        usersTable: schema.users,
        accountsTable: schema.accounts,
        sessionsTable: schema.sessions,
        verificationTokensTable: schema.verificationTokens,
      })
    : undefined,
  providers,
  session: { strategy: db ? "database" : "jwt" },
  pages: { signIn: "/signin" },
  callbacks: {
    session({ session, user }) {
      if (user) session.user.id = user.id;
      return session;
    },
  },
});
