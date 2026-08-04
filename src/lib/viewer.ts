import { cookies } from "next/headers";
import { auth, authConfigured } from "@/auth";

export type Viewer = {
  id: string;
  name: string;
  email: string | null;
  image: string | null;
  /** True when this is a throwaway per-browser identity, not a real account.
   *  Demo ballots are memory-only and are never presented as verified. */
  isDemo: boolean;
};

/**
 * Admin access is granted by email in ADMIN_EMAILS rather than a flag in the
 * database, because the first admin has to exist before there is any UI to
 * promote them with.
 */
export function isAdmin(viewer: Viewer | null): boolean {
  if (!viewer?.email) return false;
  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(viewer.email.toLowerCase());
}

export const DEMO_COOKIE = "mymbb_demo_id";

/**
 * Who is submitting. With auth configured this is the signed-in account; with
 * no database it is a per-browser demo identity so the ballot builder can be
 * tried without standing up Postgres and OAuth first.
 */
export async function getViewer(): Promise<Viewer | null> {
  if (authConfigured) {
    const session = await auth();
    const user = session?.user;
    if (!user?.id) return null;
    return {
      id: user.id,
      name: user.name ?? "You",
      email: user.email ?? null,
      image: user.image ?? null,
      isDemo: false,
    };
  }

  const demoId = (await cookies()).get(DEMO_COOKIE)?.value;
  if (!demoId) return null;
  return {
    id: demoId,
    name: "You (demo)",
    email: null,
    image: null,
    isDemo: true,
  };
}
