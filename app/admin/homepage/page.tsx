import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingTableError } from "@/lib/supabase/errors";
import { createStatistic, deleteStatistic, updateStatistic } from "@/actions/statistics";
import { updateHeroSettings } from "@/actions/hero";
import { updateProfile } from "@/actions/profile";
import {
  createHomepageExpertise,
  deleteHomepageExpertise,
  saveHomepageSettings,
  updateHomepageExpertise,
} from "@/actions/homepage";
import ImageInputField from "@/components/admin/ImageInputField";
import type { Database, Tables } from "@/types/database";

type AdminHomepagePageProps = {
  searchParams?: {
    q?: string;
    page?: string;
  };
};

type HomepageSettingRow = {
  id: string;
  philosophy_quote: string | null;
  philosophy_description: string | null;
  show_philosophy: boolean | null;
  about_preview_title: string | null;
  about_preview_text: string | null;
  about_preview_button_text: string | null;
  about_preview_url: string | null;
  cta_title: string | null;
  cta_description: string | null;
  cta_button_text: string | null;
  cta_button_url: string | null;
};

type ExpertiseRow = {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  display_order: number | null;
  visible: boolean | null;
};

type StatisticRow = Tables<"statistics"> & {
  icon?: string | null;
};

type CreateStatisticInput = Parameters<typeof createStatistic>[0];
type UpdateStatisticInput = Parameters<typeof updateStatistic>[1];

const PAGE_SIZE = 8;

function normalizeValue(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}

export default async function AdminHomepagePage({ searchParams }: AdminHomepagePageProps) {
  const supabase = createAdminClient();
  const fromLooseTable = <T extends keyof Database["public"]["Tables"]>(table: T) =>
    supabase.from(table);
  const query = (searchParams?.q ?? "").trim().toLowerCase();
  const currentPage = Number(searchParams?.page ?? "1");
  const page = Number.isFinite(currentPage) && currentPage > 0 ? currentPage : 1;

  const [heroResult, statsResult, profileResult, settingsResult, expertiseResult] = await Promise.all([
    supabase.from("hero_settings").select("*").maybeSingle(),
    supabase.from("statistics").select("*").order("display_order", { ascending: true }),
    supabase.from("profile").select("*").maybeSingle(),
    fromLooseTable("homepage_settings").select("*").maybeSingle(),
    fromLooseTable("homepage_expertise").select("*").order("display_order", { ascending: true }),
  ]);

  if (heroResult.error || statsResult.error || profileResult.error) {
    return null;
  }

  const settingsMissing = isMissingTableError(settingsResult.error ?? null, "homepage_settings");
  const expertiseMissing = isMissingTableError(expertiseResult.error ?? null, "homepage_expertise");

  if ((settingsResult.error && !settingsMissing) || (expertiseResult.error && !expertiseMissing)) {
    return null;
  }

  const hero = (heroResult.data as Tables<"hero_settings"> | null) ?? null;
  const stats = (statsResult.data as StatisticRow[] | null) ?? [];
  const profile = (profileResult.data as Tables<"profile"> | null) ?? null;
  const homepageSettings = (settingsResult.data as HomepageSettingRow | null) ?? null;
  const expertiseRows = (expertiseResult.data as ExpertiseRow[] | null) ?? [];

  const filteredExpertise = expertiseRows.filter((item) => {
    if (!query) {
      return true;
    }

    return (`${item.title} ${item.description ?? ""}`.toLowerCase().includes(query));
  });

  const totalPages = Math.max(1, Math.ceil(filteredExpertise.length / PAGE_SIZE));
  const boundedPage = Math.min(page, totalPages);
  const startIndex = (boundedPage - 1) * PAGE_SIZE;
  const pagedExpertise = filteredExpertise.slice(startIndex, startIndex + PAGE_SIZE);

  async function saveHero(formData: FormData) {
    "use server";

    if (!hero?.id) return;

    await updateHeroSettings(hero.id, {
      heading_line1: normalizeValue(formData.get("heading_line1")),
      heading_line2: normalizeValue(formData.get("heading_line2")),
      heading_line3: normalizeValue(formData.get("heading_line3")),
      subheading: normalizeValue(formData.get("subheading")),
      description: normalizeValue(formData.get("description")),
      cta_primary_text: normalizeValue(formData.get("cta_primary_text")),
      cta_primary_url: normalizeValue(formData.get("cta_primary_url")),
      cta_secondary_text: normalizeValue(formData.get("cta_secondary_text")),
      cta_secondary_url: normalizeValue(formData.get("cta_secondary_url")),
      show_availability: formData.get("show_availability") === "on",
    });
  }

  async function saveHeroProfile(formData: FormData) {
    "use server";

    if (!profile?.id) return;

    await updateProfile(profile.id, {
      username: normalizeValue(formData.get("username")),
      location: normalizeValue(formData.get("location")),
      availability_status: formData.get("availability_status") === "on",
      availability_text: normalizeValue(formData.get("availability_text")),
      profile_picture_url: normalizeValue(formData.get("profile_picture_url")),
      github_url: normalizeValue(formData.get("github_url")),
      twitter_url: normalizeValue(formData.get("twitter_url")),
      linkedin_url: normalizeValue(formData.get("linkedin_url")),
    });
  }

  async function addStat(formData: FormData) {
    "use server";

    await createStatistic({
      number: normalizeValue(formData.get("number")),
      label: normalizeValue(formData.get("label")),
      icon: normalizeValue(formData.get("icon")) || null,
      display_order: Number(formData.get("display_order") ?? 0),
      visible: formData.get("visible") === "on",
    } as CreateStatisticInput);
  }

  async function saveStat(formData: FormData) {
    "use server";

    const id = normalizeValue(formData.get("id"));
    if (!id) return;

    await updateStatistic(id, {
      number: normalizeValue(formData.get("number")),
      label: normalizeValue(formData.get("label")),
      icon: normalizeValue(formData.get("icon")) || null,
      display_order: Number(formData.get("display_order") ?? 0),
      visible: formData.get("visible") === "on",
    } as UpdateStatisticInput);
  }

  async function removeStat(formData: FormData) {
    "use server";

    const id = normalizeValue(formData.get("id"));
    if (!id) return;

    await deleteStatistic(id);
  }

  async function saveHomepageConfig(formData: FormData) {
    "use server";

    await saveHomepageSettings(homepageSettings?.id ?? null, {
      philosophy_quote: normalizeValue(formData.get("philosophy_quote")),
      philosophy_description: normalizeValue(formData.get("philosophy_description")),
      show_philosophy: formData.get("show_philosophy") === "on",
      about_preview_title: normalizeValue(formData.get("about_preview_title")),
      about_preview_text: normalizeValue(formData.get("about_preview_text")),
      about_preview_button_text: normalizeValue(formData.get("about_preview_button_text")),
      about_preview_url: normalizeValue(formData.get("about_preview_url")),
      cta_title: normalizeValue(formData.get("cta_title")),
      cta_description: normalizeValue(formData.get("cta_description")),
      cta_button_text: normalizeValue(formData.get("cta_button_text")),
      cta_button_url: normalizeValue(formData.get("cta_button_url")),
    });
  }

  async function addExpertise(formData: FormData) {
    "use server";

    await createHomepageExpertise({
      title: normalizeValue(formData.get("title")),
      description: normalizeValue(formData.get("description")),
      icon: normalizeValue(formData.get("icon")),
      display_order: Number(formData.get("display_order") ?? 0),
      visible: formData.get("visible") === "on",
    });
  }

  async function saveExpertise(formData: FormData) {
    "use server";

    const id = normalizeValue(formData.get("id"));
    if (!id) return;

    await updateHomepageExpertise(id, {
      title: normalizeValue(formData.get("title")),
      description: normalizeValue(formData.get("description")),
      icon: normalizeValue(formData.get("icon")),
      display_order: Number(formData.get("display_order") ?? 0),
      visible: formData.get("visible") === "on",
    });
  }

  async function removeExpertise(formData: FormData) {
    "use server";

    const id = normalizeValue(formData.get("id"));
    if (!id) return;

    await deleteHomepageExpertise(id);
  }

  return (
    <section className="space-y-6">
      {(settingsMissing || expertiseMissing) ? (
        <div className="surface-card rounded border border-amber-500/40 bg-amber-500/5 p-4 text-sm text-[--text-muted]">
          Homepage CMS extension tables are missing. Run the SQL in supabase/fixes/2026-06-02-homepage-about-cms.sql,
          then refresh this page.
        </div>
      ) : null}

      <form action={saveHero} className="surface-card grid gap-3 sm:grid-cols-2">
        <p className="sm:col-span-2 text-sm font-medium text-[--text-primary]">Hero configuration</p>
        <input name="heading_line1" defaultValue={hero?.heading_line1 ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <input name="heading_line2" defaultValue={hero?.heading_line2 ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <input name="heading_line3" defaultValue={hero?.heading_line3 ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <input name="subheading" defaultValue={hero?.subheading ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <textarea name="description" defaultValue={hero?.description ?? ""} className="sm:col-span-2 rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <input name="cta_primary_text" defaultValue={hero?.cta_primary_text ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <input name="cta_primary_url" defaultValue={hero?.cta_primary_url ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <input name="cta_secondary_text" defaultValue={hero?.cta_secondary_text ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <input name="cta_secondary_url" defaultValue={hero?.cta_secondary_url ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <label className="sm:col-span-2 flex items-center gap-2 text-xs text-[--text-dim]"><input name="show_availability" type="checkbox" defaultChecked={hero?.show_availability ?? false} /> show collaboration badge</label>
        <button className="sm:col-span-2 rounded bg-[--accent-blue] px-3 py-2 text-sm font-medium text-[--bg-base]">save hero</button>
      </form>

      <form action={saveHeroProfile} className="surface-card grid gap-3 sm:grid-cols-2">
        <p className="sm:col-span-2 text-sm font-medium text-[--text-primary]">Hero profile panel</p>
        <input name="username" defaultValue={profile?.username ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <input name="location" defaultValue={profile?.location ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <input name="availability_text" defaultValue={profile?.availability_text ?? ""} className="sm:col-span-2 rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <div className="sm:col-span-2">
          <ImageInputField name="profile_picture_url" label="Profile image" bucket="media" shape="circle" defaultValue={profile?.profile_picture_url ?? ""} />
        </div>
        <input name="github_url" defaultValue={profile?.github_url ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <input name="twitter_url" defaultValue={profile?.twitter_url ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <input name="linkedin_url" defaultValue={profile?.linkedin_url ?? ""} className="sm:col-span-2 rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <label className="sm:col-span-2 flex items-center gap-2 text-xs text-[--text-dim]"><input name="availability_status" type="checkbox" defaultChecked={profile?.availability_status ?? false} /> show availability status</label>
        <button className="sm:col-span-2 rounded border border-[--border] px-3 py-2 text-sm text-[--text-muted]">save profile panel</button>
      </form>

      <form action={addStat} className="surface-card grid gap-3 sm:grid-cols-5">
        <p className="sm:col-span-5 text-sm font-medium text-[--text-primary]">Add quick stat</p>
        <input name="number" placeholder="12+" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
        <input name="label" placeholder="Vulnerabilities Researched" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
        <input name="icon" placeholder="shield" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <input name="display_order" type="number" defaultValue={0} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <label className="flex items-center gap-2 text-xs text-[--text-dim]"><input name="visible" type="checkbox" defaultChecked /> visible</label>
        <button className="sm:col-span-5 rounded border border-[--border] px-3 py-2 text-sm text-[--text-muted]">add stat</button>
      </form>

      <div className="space-y-3">
        {stats.map((item) => (
          <div key={item.id} className="surface-card space-y-2">
            <form action={saveStat} className="grid gap-2 sm:grid-cols-5">
              <input type="hidden" name="id" value={item.id} />
              <input name="number" defaultValue={item.number} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
              <input name="label" defaultValue={item.label} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
              <input name="icon" defaultValue={item.icon ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
              <input name="display_order" type="number" defaultValue={item.display_order ?? 0} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
              <label className="flex items-center gap-2 text-xs text-[--text-dim]"><input name="visible" type="checkbox" defaultChecked={item.visible ?? true} /> visible</label>
              <button className="sm:col-span-5 rounded border border-[--border] px-3 py-2 text-sm text-[--text-muted]">save stat</button>
            </form>
            <form action={removeStat}>
              <input type="hidden" name="id" value={item.id} />
              <button className="rounded border border-[--border] px-3 py-1 text-xs text-[--text-muted]">delete</button>
            </form>
          </div>
        ))}
      </div>

      <form action={saveHomepageConfig} className="surface-card grid gap-3 sm:grid-cols-2">
        <p className="sm:col-span-2 text-sm font-medium text-[--text-primary]">Homepage section settings</p>
        <input name="about_preview_title" defaultValue={homepageSettings?.about_preview_title ?? "About Me"} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <input name="about_preview_button_text" defaultValue={homepageSettings?.about_preview_button_text ?? "about me"} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <textarea name="about_preview_text" defaultValue={homepageSettings?.about_preview_text ?? ""} className="sm:col-span-2 rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <input name="about_preview_url" defaultValue={homepageSettings?.about_preview_url ?? "/about"} className="sm:col-span-2 rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />

        <input name="cta_title" defaultValue={homepageSettings?.cta_title ?? ""} className="sm:col-span-2 rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <textarea name="cta_description" defaultValue={homepageSettings?.cta_description ?? ""} className="sm:col-span-2 rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <input name="cta_button_text" defaultValue={homepageSettings?.cta_button_text ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <input name="cta_button_url" defaultValue={homepageSettings?.cta_button_url ?? "/contact"} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />

        <input name="philosophy_quote" defaultValue={homepageSettings?.philosophy_quote ?? ""} className="sm:col-span-2 rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <textarea name="philosophy_description" defaultValue={homepageSettings?.philosophy_description ?? ""} className="sm:col-span-2 rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <label className="sm:col-span-2 flex items-center gap-2 text-xs text-[--text-dim]"><input name="show_philosophy" type="checkbox" defaultChecked={homepageSettings?.show_philosophy ?? true} /> show philosophy section</label>

        <button className="sm:col-span-2 rounded border border-[--border] px-3 py-2 text-sm text-[--text-muted]">save homepage settings</button>
      </form>

      {!expertiseMissing ? (
        <>
          <form method="get" className="surface-card flex flex-wrap items-center gap-2">
            <input
              name="q"
              defaultValue={query}
              placeholder="Search expertise"
              className="w-full max-w-xs rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm"
            />
            <button className="rounded border border-[--border] px-3 py-2 text-xs text-[--text-muted]">search</button>
          </form>

          <form action={addExpertise} className="surface-card grid gap-3 sm:grid-cols-5">
            <p className="sm:col-span-5 text-sm font-medium text-[--text-primary]">Add expertise card</p>
            <input name="title" placeholder="Web Security" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
            <input name="description" placeholder="Short description" className="sm:col-span-2 rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
            <input name="icon" placeholder="shield" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
            <input name="display_order" type="number" defaultValue={0} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
            <label className="sm:col-span-5 flex items-center gap-2 text-xs text-[--text-dim]"><input name="visible" type="checkbox" defaultChecked /> visible</label>
            <button className="sm:col-span-5 rounded border border-[--border] px-3 py-2 text-sm text-[--text-muted]">add expertise</button>
          </form>

          <div className="space-y-3">
            {pagedExpertise.map((item) => (
              <div key={item.id} className="surface-card space-y-2">
                <form action={saveExpertise} className="grid gap-2 sm:grid-cols-5">
                  <input type="hidden" name="id" value={item.id} />
                  <input name="title" defaultValue={item.title} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
                  <input name="description" defaultValue={item.description ?? ""} className="sm:col-span-2 rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
                  <input name="icon" defaultValue={item.icon ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
                  <input name="display_order" type="number" defaultValue={item.display_order ?? 0} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
                  <label className="sm:col-span-5 flex items-center gap-2 text-xs text-[--text-dim]"><input name="visible" type="checkbox" defaultChecked={item.visible ?? true} /> visible</label>
                  <button className="sm:col-span-5 rounded border border-[--border] px-3 py-2 text-sm text-[--text-muted]">save expertise</button>
                </form>
                <form action={removeExpertise}>
                  <input type="hidden" name="id" value={item.id} />
                  <button className="rounded border border-[--border] px-3 py-1 text-xs text-[--text-muted]">delete</button>
                </form>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-[--text-dim]">
            <span>Page {boundedPage} of {totalPages}</span>
            {boundedPage > 1 ? (
              <a href={`/admin/homepage?q=${encodeURIComponent(query)}&page=${boundedPage - 1}`} className="rounded border border-[--border] px-2 py-1">prev</a>
            ) : null}
            {boundedPage < totalPages ? (
              <a href={`/admin/homepage?q=${encodeURIComponent(query)}&page=${boundedPage + 1}`} className="rounded border border-[--border] px-2 py-1">next</a>
            ) : null}
          </div>
        </>
      ) : null}
    </section>
  );
}
