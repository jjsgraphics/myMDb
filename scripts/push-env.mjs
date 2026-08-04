/**
 * Copy .env into the linked Vercel project.
 *
 *   node scripts/push-env.mjs           # show what would be pushed
 *   node scripts/push-env.mjs --run     # actually push
 *
 * `vercel env add` takes one environment per invocation and reads the value
 * from stdin, so doing this by hand is a dozen prompts. Values are piped, never
 * passed as arguments, so nothing lands in your shell history.
 */
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const TARGETS = ["production", "preview", "development"];

// Only used by drizzle-kit and the seed/enrich scripts, which run on your
// machine. The deployed app never reads it, so it does not belong in Vercel —
// which also sidesteps the direct host being IPv6-only.
const LOCAL_ONLY = new Set(["DIRECT_URL"]);

// Must differ per environment: localhost is not your production origin. Set it
// by hand once you know the deployed URL.
const MANUAL = new Set(["AUTH_URL"]);

const run = process.argv.includes("--run");

const vars = readFileSync(".env", "utf8")
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("#"))
  .map((l) => {
    const i = l.indexOf("=");
    return i === -1 ? null : [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
  })
  .filter((kv) => kv && kv[1]);

const push = [];
for (const [key, value] of vars) {
  if (LOCAL_ONLY.has(key)) console.log(`skip  ${key}  (local only)`);
  else if (MANUAL.has(key)) console.log(`skip  ${key}  (set per environment by hand)`);
  else push.push([key, value]);
}

console.log();
for (const [key] of push) console.log(`push  ${key}  -> ${TARGETS.join(", ")}`);

if (!run) {
  console.log(`\n${push.length} variables ready. Re-run with --run to push.`);
  process.exit(0);
}

console.log();
for (const [key, value] of push) {
  for (const target of TARGETS) {
    const res = spawnSync(
      "vercel",
      ["env", "add", key, target, "--force", "--yes"],
      { input: value, encoding: "utf8", shell: true },
    );
    const ok = res.status === 0;
    console.log(`  ${ok ? "ok  " : "FAIL"} ${key} (${target})`);
    if (!ok) console.log(`       ${(res.stderr || "").trim().split("\n").slice(-2).join(" ")}`);
  }
}

console.log("\nNow set AUTH_URL to your deployed origin:");
console.log("  vercel env add AUTH_URL production");
