import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export default async function Hero() {
  const supabase = createClient();

  const [{ data: heroData, error: heroError }, { data: profileData, error: profileError }] =
    await Promise.all([
      supabase.from("hero_settings").select("*").maybeSingle(),
      supabase
        .from("profile")
        .select("job_title,bio,availability_status,availability_text")
        .maybeSingle(),
    ]);

  const hero = (heroData as Tables<"hero_settings"> | null) ?? null;
  const profile =
    (profileData as Pick<Tables<"profile">, "job_title" | "bio" | "availability_status" | "availability_text"> | null) ?? null;

  if (heroError || profileError || !hero) {
    return null;
  }

  return (
    <section
      style={{
        padding: "5rem 2rem 4rem",
        maxWidth: "760px",
        margin: "0 auto",
      }}
    >
      {hero.show_availability && profile?.availability_status ? (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            background: "var(--bg-surface)",
            border: "0.5px solid var(--border)",
            color: "var(--text-muted)",
            fontSize: "10.5px",
            padding: "3px 10px",
            borderRadius: "20px",
            marginBottom: "1.8rem",
            fontFamily: "var(--font-mono), monospace",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "var(--accent-green)",
              flexShrink: 0,
            }}
          />
          {profile.availability_text ?? "open to collaboration"}
        </div>
      ) : null}

      <h1
        style={{
          fontSize: "clamp(36px, 6vw, 52px)",
          fontWeight: 500,
          lineHeight: 1.1,
          color: "var(--text-primary)",
          letterSpacing: "-1.5px",
          marginBottom: "1.2rem",
        }}
      >
        {hero.heading_line1}
        <br />
        <span style={{ color: "var(--accent-blue)" }}>{hero.heading_line2}</span>
        <br />
        <span style={{ color: "var(--text-dim)" }}>{hero.heading_line3}</span>
      </h1>

      {(hero.subheading || profile?.job_title) && (
        <div
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: "11px",
            color: "var(--accent-blue)",
            letterSpacing: "1.2px",
            textTransform: "uppercase",
            marginBottom: "1rem",
          }}
        >
          {hero.subheading || profile?.job_title}
        </div>
      )}

      {hero.description || profile?.bio ? (
        <p
          style={{
            fontSize: "14.5px",
            color: "var(--text-dim)",
            lineHeight: 1.75,
            maxWidth: "480px",
            marginBottom: "2rem",
          }}
        >
          {hero.description ?? profile?.bio}
        </p>
      ) : null}

      <div style={{ display: "flex", gap: "9px", flexWrap: "wrap" }}>
        {hero.cta_primary_text && hero.cta_primary_url ? (
          <Link
            href={hero.cta_primary_url}
            style={{
              background: "var(--accent-blue)",
              color: "var(--bg-base)",
              fontSize: "12.5px",
              padding: "8px 20px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontWeight: 500,
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            {hero.cta_primary_text}
          </Link>
        ) : null}
        {hero.cta_secondary_text && hero.cta_secondary_url ? (
          <a
            href={hero.cta_secondary_url}
            target="_blank"
            rel="noreferrer"
            style={{
              background: "transparent",
              color: "var(--text-muted)",
              fontSize: "12.5px",
              padding: "8px 20px",
              borderRadius: "6px",
              border: "0.5px solid var(--border)",
              cursor: "pointer",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            {hero.cta_secondary_text}
          </a>
        ) : null}
      </div>
    </section>
  );
}
