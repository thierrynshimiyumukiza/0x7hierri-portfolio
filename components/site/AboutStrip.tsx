/* eslint-disable @next/next/no-img-element */
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";
import SectionHeader from "@/components/site/SectionHeader";

export default async function AboutStrip() {
  const supabase = createClient();
  const { data: profileData, error } = await supabase
    .from("profile")
    .select("name,bio,location,profile_picture_url")
    .maybeSingle();

  const profile =
    (profileData as Pick<Tables<"profile">, "name" | "bio" | "location" | "profile_picture_url"> | null) ??
    null;

  if (error || !profile) {
    return null;
  }

  return (
    <div style={{ borderTop: "0.5px solid var(--border-muted)" }}>
      <section style={{ maxWidth: "760px", margin: "0 auto", padding: "2.5rem 2rem" }}>
        <SectionHeader title="about" href="/about" />
        <article
          style={{
            background: "var(--bg-surface)",
            border: "0.5px solid var(--bg-elevated)",
            borderRadius: "8px",
            padding: "1.2rem",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          {profile.profile_picture_url ? (
            <img
              src={profile.profile_picture_url}
              alt={profile.name}
              loading="lazy"
              style={{ width: "56px", height: "56px", borderRadius: "50%", objectFit: "cover", border: "0.5px solid var(--border)" }}
            />
          ) : null}

          <div>
            <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", marginBottom: "4px" }}>{profile.name}</p>
            {profile.bio ? (
              <p style={{ fontSize: "11.5px", color: "var(--text-dim)", lineHeight: 1.6 }}>
                {profile.bio}
              </p>
            ) : null}
            {profile.location ? (
              <p style={{ fontSize: "10.5px", color: "var(--text-dim)", fontFamily: "var(--font-mono), monospace", marginTop: "6px" }}>
                {profile.location}
              </p>
            ) : null}
          </div>
        </article>
      </section>
    </div>
  );
}
