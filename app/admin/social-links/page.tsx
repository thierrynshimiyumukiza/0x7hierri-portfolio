import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingTableError } from "@/lib/supabase/errors";
import { createSocialLink, deleteSocialLink, updateSocialLink } from "@/actions/social-links";

type SocialLinkRow = {
  id: string;
  label: string;
  platform: string | null;
  url: string;
  display_order: number | null;
  visible: boolean | null;
};

export default async function AdminSocialLinksPage() {
  const supabase = createAdminClient();
  const { data, error } = await (supabase as any)
    .from("social_links")
    .select("*")
    .order("display_order", { ascending: true });

  const missingTable = isMissingTableError(error ?? null, "social_links");

  if (error && !missingTable) {
    return null;
  }

  const rows = (data as SocialLinkRow[] | null) ?? [];

  async function addLink(formData: FormData) {
    "use server";

    await createSocialLink({
      label: String(formData.get("label") ?? ""),
      platform: String(formData.get("platform") ?? ""),
      url: String(formData.get("url") ?? ""),
      display_order: Number(formData.get("display_order") ?? 0),
      visible: formData.get("visible") === "on",
    });
  }

  async function saveLink(formData: FormData) {
    "use server";

    const id = String(formData.get("id") ?? "");
    if (!id) return;

    await updateSocialLink(id, {
      label: String(formData.get("label") ?? ""),
      platform: String(formData.get("platform") ?? ""),
      url: String(formData.get("url") ?? ""),
      display_order: Number(formData.get("display_order") ?? 0),
      visible: formData.get("visible") === "on",
    });
  }

  async function removeLink(formData: FormData) {
    "use server";

    const id = String(formData.get("id") ?? "");
    if (!id) return;

    await deleteSocialLink(id);
  }

  return (
    <section className="space-y-4">
      {missingTable ? (
        <div className="surface-card rounded border border-amber-500/40 bg-amber-500/5 p-4 text-sm text-[--text-muted]">
          Table public.social_links is missing. Run supabase/fixes/2026-06-02-homepage-about-cms.sql and refresh.
        </div>
      ) : null}

      {!missingTable ? (
        <>
          <form action={addLink} className="surface-card grid gap-3 sm:grid-cols-5">
            <input name="label" placeholder="GitHub" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
            <input name="platform" placeholder="github" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
            <input name="url" placeholder="https://github.com/0x7hierri" className="sm:col-span-2 rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
            <input name="display_order" type="number" defaultValue={0} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
            <label className="sm:col-span-5 flex items-center gap-2 text-xs text-[--text-dim]"><input type="checkbox" name="visible" defaultChecked /> visible</label>
            <button className="sm:col-span-5 rounded border border-[--border] px-3 py-2 text-sm text-[--text-muted]">add social link</button>
          </form>

          {rows.map((row) => (
            <div key={row.id} className="surface-card space-y-3">
              <form action={saveLink} className="grid gap-3 sm:grid-cols-5">
                <input type="hidden" name="id" value={row.id} />
                <input name="label" defaultValue={row.label} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
                <input name="platform" defaultValue={row.platform ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
                <input name="url" defaultValue={row.url} className="sm:col-span-2 rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
                <input name="display_order" type="number" defaultValue={row.display_order ?? 0} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
                <label className="sm:col-span-5 flex items-center gap-2 text-xs text-[--text-dim]"><input type="checkbox" name="visible" defaultChecked={row.visible ?? true} /> visible</label>
                <button className="sm:col-span-5 rounded border border-[--border] px-3 py-2 text-sm text-[--text-muted]">save</button>
              </form>

              <form action={removeLink}>
                <input type="hidden" name="id" value={row.id} />
                <button className="rounded border border-[--border] px-3 py-1 text-xs text-[--text-muted]">delete</button>
              </form>
            </div>
          ))}
        </>
      ) : null}
    </section>
  );
}
