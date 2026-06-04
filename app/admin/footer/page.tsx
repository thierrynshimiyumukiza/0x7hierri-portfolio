import { updateFooterSettings } from "@/actions/footer";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/types/database";

export default async function AdminFooterPage() {
  const supabase = createAdminClient();
  const { data: footerData } = await supabase.from("footer_settings").select("*").maybeSingle();
  const footer = (footerData as Tables<"footer_settings"> | null) ?? null;

  async function submit(formData: FormData) {
    "use server";

    if (!footer?.id) return;

    await updateFooterSettings(footer.id, {
      copyright_text: String(formData.get("copyright_text") ?? ""),
      tech_stack_text: String(formData.get("tech_stack_text") ?? ""),
      contact_email: String(formData.get("contact_email") ?? ""),
      show_social_links: formData.get("show_social_links") === "on",
    });
  }

  return (
    <form action={submit} className="surface-card grid gap-3">
      <input name="copyright_text" defaultValue={footer?.copyright_text ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <textarea name="tech_stack_text" defaultValue={footer?.tech_stack_text ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <input name="contact_email" defaultValue={footer?.contact_email ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <label className="flex items-center gap-2 text-xs text-[--text-dim]"><input type="checkbox" name="show_social_links" defaultChecked={footer?.show_social_links ?? false} /> social links</label>
      <button className="rounded bg-[--accent-blue] px-3 py-2 text-sm font-medium text-[--bg-base]">save</button>
    </form>
  );
}
