import { revalidatePath } from "next/cache";
import Link from "next/link";
import {
  archiveCategory,
  listCategories,
  recomputeAll,
  upsertCategory,
  hasDatabase,
} from "@/lib/store";
import { getViewer, isAdmin } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/**
 * Category management.
 *
 * Categories are rows, so adding "Best Needle Drop" is a form submission rather
 * than a deploy. Changing maxPicks or minBallots re-runs the count across every
 * existing ballot, because those settings change what the ballots add up to.
 */
export default async function AdminPage() {
  const viewer = await getViewer();
  const categories = await listCategories();
  const allowed = isAdmin(viewer);

  async function save(formData: FormData) {
    "use server";
    const me = await getViewer();
    if (!isAdmin(me)) throw new Error("Not authorised.");

    const id = String(formData.get("id") ?? "") || undefined;
    const name = String(formData.get("name") ?? "").trim();
    const slug =
      String(formData.get("slug") ?? "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    if (!name || !slug) throw new Error("Name and slug are both required.");

    await upsertCategory({
      id,
      slug,
      name,
      blurb: String(formData.get("blurb") ?? "").trim(),
      kind: String(formData.get("kind") ?? "any") as "movie" | "tv" | "any",
      maxPicks: Number(formData.get("maxPicks") ?? 10),
      minBallots: Number(formData.get("minBallots") ?? 3),
    });

    await recomputeAll();
    revalidatePath("/");
    revalidatePath("/admin");
  }

  async function archive(formData: FormData) {
    "use server";
    const me = await getViewer();
    if (!isAdmin(me)) throw new Error("Not authorised.");
    await archiveCategory(String(formData.get("id")));
    revalidatePath("/");
    revalidatePath("/admin");
  }

  return (
    <div className="mx-auto max-w-3xl px-5 pt-14">
      <Link href="/" className="eyebrow transition-colors hover:text-bone">
        ← All categories
      </Link>

      <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight">
        Manage categories
      </h1>
      <p className="mt-4 max-w-xl text-[0.95rem] leading-relaxed text-dim">
        Add, rename or retire a poll. Retiring hides it from the site and keeps
        every ballot, so you can bring it back without losing votes.
      </p>

      {!hasDatabase && (
        <Notice>
          Demo mode. Category editing needs a real database — set{" "}
          <code className="font-mono text-stock">DATABASE_URL</code> and run{" "}
          <code className="font-mono text-stock">npm run db:push</code>.
        </Notice>
      )}

      {hasDatabase && !allowed && (
        <Notice>
          You are not on the admin list. Add your account email to{" "}
          <code className="font-mono text-stock">ADMIN_EMAILS</code> and sign in
          again.
        </Notice>
      )}

      <section className="mt-10">
        <h2 className="eyebrow">Existing</h2>
        <ul className="mt-3 rule">
          {categories.map((c) => (
            <li key={c.id} className="border-b border-line/50 py-4">
              <details>
                <summary className="flex cursor-pointer list-none items-baseline gap-3">
                  <span className="font-display text-lg font-bold">{c.name}</span>
                  <span className="eyebrow">/{c.slug}</span>
                  <span className="eyebrow ml-auto">
                    top {c.maxPicks} · min {c.minBallots}
                  </span>
                </summary>
                <CategoryForm
                  category={c}
                  save={save}
                  archive={archive}
                  disabled={!allowed}
                />
              </details>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 pb-8">
        <h2 className="eyebrow">Add a category</h2>
        <CategoryForm save={save} disabled={!allowed} />
      </section>
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-6 rounded border border-tungsten/30 bg-tungsten/5 px-4 py-3 text-sm leading-relaxed text-dim">
      {children}
    </p>
  );
}

function CategoryForm({
  category,
  save,
  archive,
  disabled,
}: {
  category?: {
    id: string;
    slug: string;
    name: string;
    blurb: string;
    kind: string;
    maxPicks: number;
    minBallots: number;
  };
  save: (formData: FormData) => Promise<void>;
  archive?: (formData: FormData) => Promise<void>;
  disabled: boolean;
}) {
  return (
    <div className="mt-4 grid gap-3">
      <form action={save} className="grid gap-3">
        {category && <input type="hidden" name="id" value={category.id} />}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name">
            <input
              name="name"
              defaultValue={category?.name}
              required
              disabled={disabled}
              placeholder="Best Needle Drop"
              className={inputClass}
            />
          </Field>
          <Field label="URL slug" hint="Leave blank to derive it from the name.">
            <input
              name="slug"
              defaultValue={category?.slug}
              disabled={disabled}
              placeholder="best-needle-drop"
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Blurb" hint="The question voters are answering.">
          <input
            name="blurb"
            defaultValue={category?.blurb}
            disabled={disabled}
            placeholder="One song, one scene, and the whole thing lifts."
            className={inputClass}
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Eligible">
            <select
              name="kind"
              defaultValue={category?.kind ?? "any"}
              disabled={disabled}
              className={inputClass}
            >
              <option value="any">Films and series</option>
              <option value="movie">Films only</option>
              <option value="tv">Series only</option>
            </select>
          </Field>
          <Field label="Picks per ballot">
            <input
              name="maxPicks"
              type="number"
              min={3}
              max={25}
              defaultValue={category?.maxPicks ?? 10}
              disabled={disabled}
              className={inputClass}
            />
          </Field>
          <Field label="Ballots to qualify" hint="Keeps one-vote wonders off the board.">
            <input
              name="minBallots"
              type="number"
              min={1}
              max={100}
              defaultValue={category?.minBallots ?? 3}
              disabled={disabled}
              className={inputClass}
            />
          </Field>
        </div>

        <div>
          <button
            type="submit"
            disabled={disabled}
            className="rounded-full bg-tungsten px-4 py-2 text-sm font-semibold text-ink transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {category ? "Save changes" : "Create category"}
          </button>
        </div>
      </form>

      {category && archive && (
        <form action={archive}>
          <input type="hidden" name="id" value={category.id} />
          <button
            type="submit"
            disabled={disabled}
            className="text-sm text-dim underline-offset-2 transition-colors hover:text-tungsten hover:underline disabled:opacity-40"
          >
            Retire this category
          </button>
        </form>
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded border border-line bg-ink px-3 py-2 text-sm placeholder:text-dim/60 focus:border-tungsten focus:outline-none disabled:opacity-50";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <span className="mt-1.5 block">{children}</span>
      {hint && <span className="mt-1 block text-xs text-dim">{hint}</span>}
    </label>
  );
}
