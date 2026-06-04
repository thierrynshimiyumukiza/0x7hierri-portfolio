import { updateProfile } from "@/actions/profile";
import ImageInputField from "@/components/admin/ImageInputField";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/types/database";

const DEFAULT_PROFILE_IMAGE_FILE = "1779220114566-f5843b52-d862-4e90-9c6c-6bd53c2f63e5-thierry.png";

function getDefaultProfileImageUrl() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return "";
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${DEFAULT_PROFILE_IMAGE_FILE}`;
}

export default async function AdminProfilePage() {
  const supabase = createAdminClient();
  const { data: profileData } = await supabase.from("profile").select("*").maybeSingle();
  const profile = (profileData as Tables<"profile"> | null) ?? null;

  async function submit(formData: FormData) {
    "use server";

    if (!profile?.id) return;

    const submittedProfilePicture = String(formData.get("profile_picture_url") ?? "").trim();
    const defaultProfilePicture = getDefaultProfileImageUrl();

    await updateProfile(profile.id, {
      name: String(formData.get("name") ?? ""),
      username: String(formData.get("username") ?? ""),
      job_title: String(formData.get("job_title") ?? ""),
      bio: String(formData.get("bio") ?? ""),
      location: String(formData.get("location") ?? ""),
      email: String(formData.get("email") ?? ""),
      github_url: String(formData.get("github_url") ?? ""),
      linkedin_url: String(formData.get("linkedin_url") ?? ""),
      twitter_url: String(formData.get("twitter_url") ?? ""),
      website_url: String(formData.get("website_url") ?? ""),
      profile_picture_url: submittedProfilePicture || profile.profile_picture_url || defaultProfilePicture,
      resume_url: String(formData.get("resume_url") ?? ""),
      availability_status: formData.get("availability_status") === "on",
      availability_text: String(formData.get("availability_text") ?? ""),
      skills: String(formData.get("skills") ?? "")
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
    });
  }

  return (
    <form action={submit} className="surface-card grid gap-3 sm:grid-cols-2">
      <input name="name" defaultValue={profile?.name ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <input name="username" defaultValue={profile?.username ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <input name="job_title" defaultValue={profile?.job_title ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <input name="location" defaultValue={profile?.location ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <input name="email" defaultValue={profile?.email ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <input name="availability_text" defaultValue={profile?.availability_text ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <textarea name="bio" defaultValue={profile?.bio ?? ""} className="sm:col-span-2 rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <input name="github_url" defaultValue={profile?.github_url ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <input name="linkedin_url" defaultValue={profile?.linkedin_url ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <input name="twitter_url" defaultValue={profile?.twitter_url ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <input name="website_url" defaultValue={profile?.website_url ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <div className="sm:col-span-2">
        <ImageInputField
          name="profile_picture_url"
          label="Profile picture"
          bucket="media"
          defaultValue={profile?.profile_picture_url || getDefaultProfileImageUrl()}
          shape="circle"
        />
      </div>
      <input name="resume_url" defaultValue={profile?.resume_url ?? ""} className="rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <input name="skills" defaultValue={(profile?.skills ?? []).join(",")} className="sm:col-span-2 rounded border border-[--border] bg-[--bg-base] px-3 py-2 text-sm" />
      <label className="sm:col-span-2 flex items-center gap-2 text-xs text-[--text-dim]"><input type="checkbox" name="availability_status" defaultChecked={profile?.availability_status ?? false} /> availability</label>
      <button className="sm:col-span-2 rounded bg-[--accent-blue] px-3 py-2 text-sm font-medium text-[--bg-base]">save</button>
    </form>
  );
}
