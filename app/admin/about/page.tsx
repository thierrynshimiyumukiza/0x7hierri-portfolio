import {
  createAboutFocusArea,
  createAboutInterest,
  createAboutSkillGroup,
  createEducationEntry,
  createCertification,
  createTimelineItem,
  deleteAboutFocusArea,
  deleteAboutInterest,
  deleteAboutSkillGroup,
  deleteEducationEntry,
  deleteCertification,
  deleteTimelineItem,
  updateAboutFocusArea,
  updateAboutInterest,
  updateAboutSkillGroup,
  updateCertification,
  updateEducationEntry,
  updateAboutSettings,
  updateTimelineItem,
} from "@/actions/about";
import { redirect } from "next/navigation";
import ImageInputField from "@/components/admin/ImageInputField";
import { isMissingTableError, isMissingTableErrorMessage } from "@/lib/supabase/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Tables } from "@/types/database";

type AdminAboutPageProps = {
  searchParams?: {
    error?: string;
  };
};

type AboutFocusAreaRow = {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  display_order: number | null;
  visible: boolean | null;
};

type AboutInterestRow = {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  display_order: number | null;
  visible: boolean | null;
};

type AboutSkillGroupRow = {
  id: string;
  group_title: string;
  items: string[] | null;
  display_order: number | null;
  visible: boolean | null;
};

export default async function AdminAboutPage({ searchParams }: AdminAboutPageProps) {
  const supabase = createAdminClient();
  const fromLooseTable = <T extends keyof Database["public"]["Tables"]>(table: T) =>
    supabase.from(table);

  const [
    { data: aboutData, error: aboutError },
    { data: timelineData, error: timelineError },
    { data: certificationsData, error: certificationsError },
    { data: educationData, error: educationError },
    { data: focusData, error: focusError },
    { data: interestsData, error: interestsError },
    { data: skillGroupsData, error: skillGroupsError },
  ] = await Promise.all([
    supabase.from("about_settings").select("*").maybeSingle(),
    supabase.from("career_timeline").select("*").order("display_order", { ascending: true }),
    supabase.from("certifications").select("*").order("display_order", { ascending: true }),
    supabase.from("education_entries").select("*").order("display_order", { ascending: true }),
    fromLooseTable("about_focus_areas").select("*").order("display_order", { ascending: true }),
    fromLooseTable("about_interests").select("*").order("display_order", { ascending: true }),
    fromLooseTable("about_skill_groups").select("*").order("display_order", { ascending: true }),
  ]);

  const educationTableMissing = isMissingTableError(educationError, "education_entries");
  const focusTableMissing = isMissingTableError(focusError, "about_focus_areas");
  const interestsTableMissing = isMissingTableError(interestsError, "about_interests");
  const skillGroupsTableMissing = isMissingTableError(skillGroupsError, "about_skill_groups");

  if (
    aboutError ||
    timelineError ||
    certificationsError ||
    (educationError && !educationTableMissing) ||
    (focusError && !focusTableMissing) ||
    (interestsError && !interestsTableMissing) ||
    (skillGroupsError && !skillGroupsTableMissing)
  ) {
    return null;
  }

  const about = (aboutData as Tables<"about_settings"> | null) ?? null;
  const timeline = (timelineData as Tables<"career_timeline">[] | null) ?? [];
  const certifications = (certificationsData as Tables<"certifications">[] | null) ?? [];
  const showEducationWarning = educationTableMissing || searchParams?.error === "education-table-missing";
  const education = (educationData as Tables<"education_entries">[] | null) ?? [];
  const focusAreas = (focusData as AboutFocusAreaRow[] | null) ?? [];
  const interests = (interestsData as AboutInterestRow[] | null) ?? [];
  const skillGroups = (skillGroupsData as AboutSkillGroupRow[] | null) ?? [];
  const showCmsExtensionWarning = focusTableMissing || interestsTableMissing || skillGroupsTableMissing;

  async function saveAbout(formData: FormData) {
    "use server";

    if (!about?.id) return;

    await updateAboutSettings(about.id, {
      hero_text: String(formData.get("hero_text") ?? ""),
      biography: String(formData.get("biography") ?? ""),
      profile_image_url: String(formData.get("profile_image_url") ?? ""),
    });
  }

  async function addTimeline(formData: FormData) {
    "use server";

    await createTimelineItem({
      title: String(formData.get("title") ?? ""),
      organization: String(formData.get("organization") ?? ""),
      description: String(formData.get("description") ?? ""),
      start_date: String(formData.get("start_date") ?? "") || null,
      end_date: String(formData.get("end_date") ?? "") || null,
      is_current: formData.get("is_current") === "on",
      type: String(formData.get("type") ?? "experience"),
      display_order: Number(formData.get("display_order") ?? 0),
    });
  }

  async function removeTimeline(formData: FormData) {
    "use server";

    const id = String(formData.get("id") ?? "");
    if (!id) return;
    await deleteTimelineItem(id);
  }

  async function saveTimeline(formData: FormData) {
    "use server";

    const id = String(formData.get("id") ?? "");
    if (!id) return;

    await updateTimelineItem(id, {
      title: String(formData.get("title") ?? ""),
      organization: String(formData.get("organization") ?? ""),
      description: String(formData.get("description") ?? ""),
      start_date: String(formData.get("start_date") ?? "") || null,
      end_date: String(formData.get("end_date") ?? "") || null,
      is_current: formData.get("is_current") === "on",
      type: String(formData.get("type") ?? "experience"),
      display_order: Number(formData.get("display_order") ?? 0),
    });
  }

  async function addCertification(formData: FormData) {
    "use server";

    await createCertification({
      name: String(formData.get("name") ?? ""),
      issuer: String(formData.get("issuer") ?? ""),
      date_earned: String(formData.get("date_earned") ?? "") || null,
      url: String(formData.get("url") ?? ""),
      badge_url: String(formData.get("badge_url") ?? ""),
      display_order: Number(formData.get("display_order") ?? 0),
    });
  }

  async function removeCertification(formData: FormData) {
    "use server";

    const id = String(formData.get("id") ?? "");
    if (!id) return;
    await deleteCertification(id);
  }

  async function saveCertification(formData: FormData) {
    "use server";

    const id = String(formData.get("id") ?? "");
    if (!id) return;

    await updateCertification(id, {
      name: String(formData.get("name") ?? ""),
      issuer: String(formData.get("issuer") ?? ""),
      date_earned: String(formData.get("date_earned") ?? "") || null,
      url: String(formData.get("url") ?? ""),
      badge_url: String(formData.get("badge_url") ?? ""),
      display_order: Number(formData.get("display_order") ?? 0),
    });
  }

  async function addEducation(formData: FormData) {
    "use server";

    try {
      await createEducationEntry({
        school_name: String(formData.get("school_name") ?? ""),
        degree: String(formData.get("degree") ?? ""),
        field_of_study: String(formData.get("field_of_study") ?? ""),
        logo_url: String(formData.get("logo_url") ?? "") || null,
        school_url: String(formData.get("school_url") ?? "") || null,
        location: String(formData.get("location") ?? "") || null,
        start_date: String(formData.get("start_date") ?? "") || null,
        end_date: String(formData.get("end_date") ?? "") || null,
        is_current: formData.get("is_current") === "on",
        description: String(formData.get("description") ?? "") || null,
        display_order: Number(formData.get("display_order") ?? 0),
      });
    } catch (error) {
      if (isMissingTableErrorMessage(error, "education_entries")) {
        redirect("/admin/about?error=education-table-missing");
      }
      throw error;
    }
  }

  async function saveEducation(formData: FormData) {
    "use server";

    const id = String(formData.get("id") ?? "");
    if (!id) return;

    try {
      await updateEducationEntry(id, {
        school_name: String(formData.get("school_name") ?? ""),
        degree: String(formData.get("degree") ?? ""),
        field_of_study: String(formData.get("field_of_study") ?? ""),
        logo_url: String(formData.get("logo_url") ?? "") || null,
        school_url: String(formData.get("school_url") ?? "") || null,
        location: String(formData.get("location") ?? "") || null,
        start_date: String(formData.get("start_date") ?? "") || null,
        end_date: String(formData.get("end_date") ?? "") || null,
        is_current: formData.get("is_current") === "on",
        description: String(formData.get("description") ?? "") || null,
        display_order: Number(formData.get("display_order") ?? 0),
      });
    } catch (error) {
      if (isMissingTableErrorMessage(error, "education_entries")) {
        redirect("/admin/about?error=education-table-missing");
      }
      throw error;
    }
  }

  async function removeEducation(formData: FormData) {
    "use server";

    const id = String(formData.get("id") ?? "");
    if (!id) return;
    try {
      await deleteEducationEntry(id);
    } catch (error) {
      if (isMissingTableErrorMessage(error, "education_entries")) {
        redirect("/admin/about?error=education-table-missing");
      }
      throw error;
    }
  }

  async function addFocusArea(formData: FormData) {
    "use server";

    await createAboutFocusArea({
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      icon: String(formData.get("icon") ?? ""),
      display_order: Number(formData.get("display_order") ?? 0),
      visible: formData.get("visible") === "on",
    });
  }

  async function saveFocusArea(formData: FormData) {
    "use server";

    const id = String(formData.get("id") ?? "");
    if (!id) return;

    await updateAboutFocusArea(id, {
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      icon: String(formData.get("icon") ?? ""),
      display_order: Number(formData.get("display_order") ?? 0),
      visible: formData.get("visible") === "on",
    });
  }

  async function removeFocusArea(formData: FormData) {
    "use server";

    const id = String(formData.get("id") ?? "");
    if (!id) return;

    await deleteAboutFocusArea(id);
  }

  async function addInterest(formData: FormData) {
    "use server";

    await createAboutInterest({
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      icon: String(formData.get("icon") ?? ""),
      display_order: Number(formData.get("display_order") ?? 0),
      visible: formData.get("visible") === "on",
    });
  }

  async function saveInterest(formData: FormData) {
    "use server";

    const id = String(formData.get("id") ?? "");
    if (!id) return;

    await updateAboutInterest(id, {
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      icon: String(formData.get("icon") ?? ""),
      display_order: Number(formData.get("display_order") ?? 0),
      visible: formData.get("visible") === "on",
    });
  }

  async function removeInterest(formData: FormData) {
    "use server";

    const id = String(formData.get("id") ?? "");
    if (!id) return;

    await deleteAboutInterest(id);
  }

  async function addSkillGroup(formData: FormData) {
    "use server";

    await createAboutSkillGroup({
      group_title: String(formData.get("group_title") ?? ""),
      items: String(formData.get("items") ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      display_order: Number(formData.get("display_order") ?? 0),
      visible: formData.get("visible") === "on",
    });
  }

  async function saveSkillGroup(formData: FormData) {
    "use server";

    const id = String(formData.get("id") ?? "");
    if (!id) return;

    await updateAboutSkillGroup(id, {
      group_title: String(formData.get("group_title") ?? ""),
      items: String(formData.get("items") ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      display_order: Number(formData.get("display_order") ?? 0),
      visible: formData.get("visible") === "on",
    });
  }

  async function removeSkillGroup(formData: FormData) {
    "use server";

    const id = String(formData.get("id") ?? "");
    if (!id) return;

    await deleteAboutSkillGroup(id);
  }

  return (
    <section className="space-y-4">
      <form action={saveAbout} className="surface-card grid gap-3">
        <p className="text-sm font-medium text-[--text-primary]">About profile</p>
        <input
          name="hero_text"
          defaultValue={about?.hero_text ?? ""}
          placeholder="Hero text"
          className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm"
        />
        <textarea
          name="biography"
          defaultValue={about?.biography ?? ""}
          placeholder="Biography"
          rows={6}
          className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm"
        />
        <ImageInputField
          name="profile_image_url"
          label="Profile image"
          bucket="media"
          defaultValue={about?.profile_image_url ?? ""}
          shape="circle"
        />
        <button className="rounded bg-[--accent-blue] px-3 py-2 text-sm font-medium text-[--bg-base]">save</button>
      </form>

      <form action={addTimeline} className="surface-card grid gap-3 sm:grid-cols-3">
        <p className="sm:col-span-3 text-sm font-medium text-[--text-primary]">Add career entry</p>
        <input name="title" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
        <input name="organization" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <input name="type" defaultValue="experience" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <textarea name="description" className="sm:col-span-3 rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <input type="date" name="start_date" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <input type="date" name="end_date" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <input type="number" name="display_order" defaultValue={0} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <label className="sm:col-span-3 flex items-center gap-2 text-xs text-[--text-dim]"><input type="checkbox" name="is_current" /> current</label>
        <button className="sm:col-span-3 rounded border border-[--border] px-3 py-2 text-sm text-[--text-muted]">add timeline</button>
      </form>

      {timeline.map((item) => (
        <div key={item.id} className="surface-card space-y-3">
          <form action={saveTimeline} className="grid gap-3 sm:grid-cols-3">
            <input type="hidden" name="id" value={item.id} />
            <input name="title" defaultValue={item.title} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
            <input name="organization" defaultValue={item.organization ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
            <input name="type" defaultValue={item.type ?? "experience"} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
            <textarea name="description" defaultValue={item.description ?? ""} className="sm:col-span-3 rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
            <input type="date" name="start_date" defaultValue={item.start_date ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
            <input type="date" name="end_date" defaultValue={item.end_date ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
            <input type="number" name="display_order" defaultValue={item.display_order ?? 0} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
            <label className="sm:col-span-3 flex items-center gap-2 text-xs text-[--text-dim]">
              <input type="checkbox" name="is_current" defaultChecked={Boolean(item.is_current)} />
              current
            </label>
            <button className="sm:col-span-3 rounded border border-[--border] px-3 py-2 text-sm text-[--text-muted]">save timeline</button>
          </form>

          <form action={removeTimeline}>
            <input type="hidden" name="id" value={item.id} />
            <button className="rounded border border-[--border] px-3 py-1 text-xs text-[--text-muted]">delete</button>
          </form>
        </div>
      ))}

      <form action={addCertification} className="surface-card grid gap-3 sm:grid-cols-3">
        <p className="sm:col-span-3 text-sm font-medium text-[--text-primary]">Add certification</p>
        <input name="name" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
        <input name="issuer" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <input type="date" name="date_earned" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <input name="url" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <div className="sm:col-span-3">
          <ImageInputField name="badge_url" label="Badge image" bucket="media" />
        </div>
        <input type="number" name="display_order" defaultValue={0} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
        <button className="sm:col-span-3 rounded border border-[--border] px-3 py-2 text-sm text-[--text-muted]">add certification</button>
      </form>

      {certifications.map((item) => (
        <div key={item.id} className="surface-card space-y-3">
          <form action={saveCertification} className="grid gap-3 sm:grid-cols-3">
            <input type="hidden" name="id" value={item.id} />
            <input name="name" defaultValue={item.name} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
            <input name="issuer" defaultValue={item.issuer ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
            <input type="date" name="date_earned" defaultValue={item.date_earned ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
            <input name="url" defaultValue={item.url ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
            <div className="sm:col-span-3">
              <ImageInputField
                name="badge_url"
                label="Badge image"
                bucket="media"
                defaultValue={item.badge_url ?? ""}
              />
            </div>
            <input type="number" name="display_order" defaultValue={item.display_order ?? 0} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
            <button className="sm:col-span-3 rounded border border-[--border] px-3 py-2 text-sm text-[--text-muted]">save certification</button>
          </form>

          <form action={removeCertification}>
            <input type="hidden" name="id" value={item.id} />
            <button className="rounded border border-[--border] px-3 py-1 text-xs text-[--text-muted]">delete</button>
          </form>
        </div>
      ))}

      {showEducationWarning ? (
        <div className="surface-card rounded border border-amber-500/40 bg-amber-500/5 p-4 text-sm text-[--text-muted]">
          Education is temporarily unavailable because table <code>public.education_entries</code> is missing in Supabase.
          Run <code>supabase/schema.sql</code> in your Supabase SQL editor, then refresh this page.
        </div>
      ) : (
        <>
          <form action={addEducation} className="surface-card grid gap-3 sm:grid-cols-3">
            <p className="sm:col-span-3 text-sm font-medium text-[--text-primary]">Add education</p>
            <input name="school_name" placeholder="School" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
            <input name="degree" placeholder="Degree" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
            <input name="field_of_study" placeholder="Field" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
            <div className="sm:col-span-3">
              <ImageInputField name="logo_url" label="School logo" bucket="media" />
            </div>
            <input name="school_url" placeholder="School URL" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
            <input name="location" placeholder="Location" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
            <input type="number" name="display_order" defaultValue={0} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
            <input type="date" name="start_date" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
            <input type="date" name="end_date" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
            <label className="flex items-center gap-2 text-xs text-[--text-dim]"><input type="checkbox" name="is_current" /> current</label>
            <textarea
              name="description"
              placeholder="Description"
              className="sm:col-span-3 rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm"
            />
            <button className="sm:col-span-3 rounded border border-[--border] px-3 py-2 text-sm text-[--text-muted]">add education</button>
          </form>

          {education.map((item) => (
            <div key={item.id} className="surface-card space-y-3">
              <form action={saveEducation} className="grid gap-3 sm:grid-cols-3">
                <input type="hidden" name="id" value={item.id} />
                <input name="school_name" defaultValue={item.school_name} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
                <input name="degree" defaultValue={item.degree ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
                <input name="field_of_study" defaultValue={item.field_of_study ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
                <div className="sm:col-span-3">
                  <ImageInputField
                    name="logo_url"
                    label="School logo"
                    bucket="media"
                    defaultValue={item.logo_url ?? ""}
                  />
                </div>
                <input name="school_url" defaultValue={item.school_url ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
                <input name="location" defaultValue={item.location ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
                <input type="number" name="display_order" defaultValue={item.display_order ?? 0} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
                <input type="date" name="start_date" defaultValue={item.start_date ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
                <input type="date" name="end_date" defaultValue={item.end_date ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
                <label className="flex items-center gap-2 text-xs text-[--text-dim]">
                  <input type="checkbox" name="is_current" defaultChecked={Boolean(item.is_current)} />
                  current
                </label>
                <textarea name="description" defaultValue={item.description ?? ""} className="sm:col-span-3 rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
                <button className="sm:col-span-3 rounded border border-[--border] px-3 py-2 text-sm text-[--text-muted]">save education</button>
              </form>

              <form action={removeEducation}>
                <input type="hidden" name="id" value={item.id} />
                <button className="rounded border border-[--border] px-3 py-1 text-xs text-[--text-muted]">delete</button>
              </form>
            </div>
          ))}
        </>
      )}

      {showCmsExtensionWarning ? (
        <div className="surface-card rounded border border-amber-500/40 bg-amber-500/5 p-4 text-sm text-[--text-muted]">
          About CMS extension tables are missing. Run <code>supabase/fixes/2026-06-02-homepage-about-cms.sql</code>
          in your Supabase SQL editor, then refresh this page.
        </div>
      ) : null}

      {!skillGroupsTableMissing ? (
        <>
          <form action={addSkillGroup} className="surface-card grid gap-3 sm:grid-cols-3">
            <p className="sm:col-span-3 text-sm font-medium text-[--text-primary]">Add skill group</p>
            <input name="group_title" placeholder="Web Security" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
            <input name="items" placeholder="Vulnerability Research, Penetration Testing" className="sm:col-span-2 rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
            <input type="number" name="display_order" defaultValue={0} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
            <label className="sm:col-span-2 flex items-center gap-2 text-xs text-[--text-dim]"><input type="checkbox" name="visible" defaultChecked /> visible</label>
            <button className="sm:col-span-3 rounded border border-[--border] px-3 py-2 text-sm text-[--text-muted]">add skill group</button>
          </form>

          {skillGroups.map((item) => (
            <div key={item.id} className="surface-card space-y-3">
              <form action={saveSkillGroup} className="grid gap-3 sm:grid-cols-3">
                <input type="hidden" name="id" value={item.id} />
                <input name="group_title" defaultValue={item.group_title} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
                <input name="items" defaultValue={(item.items ?? []).join(", ")} className="sm:col-span-2 rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
                <input type="number" name="display_order" defaultValue={item.display_order ?? 0} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
                <label className="sm:col-span-2 flex items-center gap-2 text-xs text-[--text-dim]"><input type="checkbox" name="visible" defaultChecked={item.visible ?? true} /> visible</label>
                <button className="sm:col-span-3 rounded border border-[--border] px-3 py-2 text-sm text-[--text-muted]">save skill group</button>
              </form>

              <form action={removeSkillGroup}>
                <input type="hidden" name="id" value={item.id} />
                <button className="rounded border border-[--border] px-3 py-1 text-xs text-[--text-muted]">delete</button>
              </form>
            </div>
          ))}
        </>
      ) : null}

      {!focusTableMissing ? (
        <>
          <form action={addFocusArea} className="surface-card grid gap-3 sm:grid-cols-4">
            <p className="sm:col-span-4 text-sm font-medium text-[--text-primary]">Add focus area</p>
            <input name="title" placeholder="Web Application Security" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
            <input name="icon" placeholder="shield" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
            <input type="number" name="display_order" defaultValue={0} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
            <label className="flex items-center gap-2 text-xs text-[--text-dim]"><input type="checkbox" name="visible" defaultChecked /> visible</label>
            <textarea name="description" rows={3} className="sm:col-span-4 rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
            <button className="sm:col-span-4 rounded border border-[--border] px-3 py-2 text-sm text-[--text-muted]">add focus area</button>
          </form>

          {focusAreas.map((item) => (
            <div key={item.id} className="surface-card space-y-3">
              <form action={saveFocusArea} className="grid gap-3 sm:grid-cols-4">
                <input type="hidden" name="id" value={item.id} />
                <input name="title" defaultValue={item.title} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
                <input name="icon" defaultValue={item.icon ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
                <input type="number" name="display_order" defaultValue={item.display_order ?? 0} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
                <label className="flex items-center gap-2 text-xs text-[--text-dim]"><input type="checkbox" name="visible" defaultChecked={item.visible ?? true} /> visible</label>
                <textarea name="description" defaultValue={item.description ?? ""} rows={3} className="sm:col-span-4 rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
                <button className="sm:col-span-4 rounded border border-[--border] px-3 py-2 text-sm text-[--text-muted]">save focus area</button>
              </form>

              <form action={removeFocusArea}>
                <input type="hidden" name="id" value={item.id} />
                <button className="rounded border border-[--border] px-3 py-1 text-xs text-[--text-muted]">delete</button>
              </form>
            </div>
          ))}
        </>
      ) : null}

      {!interestsTableMissing ? (
        <>
          <form action={addInterest} className="surface-card grid gap-3 sm:grid-cols-4">
            <p className="sm:col-span-4 text-sm font-medium text-[--text-primary]">Add interest item</p>
            <input name="title" placeholder="Security Research" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
            <input name="icon" placeholder="search" className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
            <input type="number" name="display_order" defaultValue={0} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
            <label className="flex items-center gap-2 text-xs text-[--text-dim]"><input type="checkbox" name="visible" defaultChecked /> visible</label>
            <textarea name="description" rows={3} className="sm:col-span-4 rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
            <button className="sm:col-span-4 rounded border border-[--border] px-3 py-2 text-sm text-[--text-muted]">add interest</button>
          </form>

          {interests.map((item) => (
            <div key={item.id} className="surface-card space-y-3">
              <form action={saveInterest} className="grid gap-3 sm:grid-cols-4">
                <input type="hidden" name="id" value={item.id} />
                <input name="title" defaultValue={item.title} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
                <input name="icon" defaultValue={item.icon ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
                <input type="number" name="display_order" defaultValue={item.display_order ?? 0} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
                <label className="flex items-center gap-2 text-xs text-[--text-dim]"><input type="checkbox" name="visible" defaultChecked={item.visible ?? true} /> visible</label>
                <textarea name="description" defaultValue={item.description ?? ""} rows={3} className="sm:col-span-4 rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" required />
                <button className="sm:col-span-4 rounded border border-[--border] px-3 py-2 text-sm text-[--text-muted]">save interest</button>
              </form>

              <form action={removeInterest}>
                <input type="hidden" name="id" value={item.id} />
                <button className="rounded border border-[--border] px-3 py-1 text-xs text-[--text-muted]">delete</button>
              </form>
            </div>
          ))}
        </>
      ) : null}
    </section>
  );
}
