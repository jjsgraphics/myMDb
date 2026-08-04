import { NextResponse, type NextRequest } from "next/server";
import { DEMO_COOKIE } from "@/lib/viewer";

/** Gives every browser a stable demo identity so the ballot builder works
 *  before OAuth is configured. Harmless once real sign-in is switched on —
 *  `getViewer` stops reading it. */
export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  if (!req.cookies.get(DEMO_COOKIE)) {
    res.cookies.set(DEMO_COOKIE, `demo_${crypto.randomUUID()}`, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return res;
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
