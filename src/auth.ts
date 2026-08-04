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
const providers: NextAuthConfig["providers"] = [];
if (process.env.AUTH_GOOGLE_ID) providers.push(Google);
if (process.env.AUTH_DISCORD_ID) providers.push(Discord);

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
