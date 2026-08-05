import type { Metadata } from "next";
import Link from "next/link";
import { Bricolage_Grotesque, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { getViewer } from "@/lib/viewer";
import { authConfigured } from "@/auth";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "800"],
});
const body = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "MyMDb — what everyone actually puts at the top",
  description:
    "Submit your ranked top ten in any category. Every ballot is counted into one public leaderboard.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const viewer = await getViewer();

  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="min-h-dvh">
        <header className="sticky top-0 z-40 border-b border-line/70 bg-ink/85 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-5">
            <Link href="/" className="group flex items-baseline gap-[0px]">
              <span className="font-display text-[1.35rem] font-extrabold tracking-tight text-bone">
                MyM
              </span>
              <span className="font-display text-[1.35rem] font-extrabold tracking-tight text-tungsten">
                Db
              </span>
            </Link>

            <nav className="hidden items-center gap-5 text-sm text-dim sm:flex">
              <Link href="/" className="transition-colors hover:text-bone">
                Categories
              </Link>
              {viewer ? (
                <Link href="/me" className="transition-colors hover:text-bone">
                  Your lists
                </Link>
              ) : null}
              <Link href="/admin" className="transition-colors hover:text-bone">
                Manage
              </Link>
            </nav>

            <div className="ml-auto flex items-center gap-3">
              {viewer ? (
                <Link
                  href="/me"
                  className="eyebrow max-w-[12rem] truncate transition-colors hover:text-bone"
                >
                  {viewer.name}
                </Link>
              ) : authConfigured ? (
                <Link
                  href="/signin"
                  className="rounded-full bg-tungsten px-3.5 py-1.5 text-sm font-medium text-ink transition-opacity hover:opacity-90"
                >
                  Sign in
                </Link>
              ) : null}
            </div>
          </div>
        </header>

        <main>{children}</main>

        <footer className="mt-24 border-t border-line/70">
          <div className="mx-auto max-w-6xl px-5 py-10 text-sm text-dim">
            <p className="max-w-xl">
              Points come from ranked ballots, not star ratings. Your first pick
              is worth ten points, your tenth is worth one.
            </p>
            <p className="mt-4 text-xs">
              Title data and artwork from{" "}
              <a
                href="https://www.themoviedb.org/"
                className="text-stock underline-offset-2 hover:underline"
                rel="noreferrer noopener"
                target="_blank"
              >
                TMDB
              </a>
              . This product uses the TMDB API but is not endorsed or certified
              by TMDB.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
