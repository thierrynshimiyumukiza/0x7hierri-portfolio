import type { Metadata } from "next";
import { ArrowUpRight, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSeoMetadata } from "@/lib/seo";
import type { Tables } from "@/types/database";

export async function generateMetadata(): Promise<Metadata> {
  return getSeoMetadata("contact");
}

export default async function ContactPage() {
  const supabase = createClient();
  const [{ data: profileData, error: profileError }, { data: footerData, error: footerError }] =
    await Promise.all([
      supabase
        .from("profile")
        .select("email,github_url,linkedin_url,twitter_url,website_url")
        .maybeSingle(),
      supabase.from("footer_settings").select("contact_email").maybeSingle(),
    ]);

  if (profileError || footerError) {
    return null;
  }

  const profile =
    (profileData as Pick<
      Tables<"profile">,
      "email" | "github_url" | "linkedin_url" | "twitter_url" | "website_url"
    > | null) ?? null;
  const footer = (footerData as Pick<Tables<"footer_settings">, "contact_email"> | null) ?? null;

  const links = [
    { label: "GitHub", url: profile?.github_url },
    { label: "LinkedIn", url: profile?.linkedin_url },
    { label: "X / Twitter", url: profile?.twitter_url },
    { label: "Website", url: profile?.website_url },
  ].filter((link): link is { label: string; url: string } => Boolean(link.url));

  const email = profile?.email ?? footer?.contact_email;

  return (
    <div className="ui-wrap" style={{ maxWidth: 920 }}>
      <section className="flex flex-col gap-4" style={{ paddingTop: 72, paddingBottom: 36 }}>
        <p className="ui-label">$ ping 0x7hierri</p>
        <h1 className="ui-h1">Get in touch</h1>
        <p className="ui-lead">
          Questions about a writeup, a research collaboration or a role: email is the fastest way to reach me.
        </p>
      </section>

      <section
        className="grid gap-5"
        style={{ paddingBottom: 96, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))" }}
      >
        {email ? (
          <a href={`mailto:${email}`} className="ui-card ui-row-link flex flex-col gap-4" style={{ padding: 28 }}>
            <span
              className="flex items-center justify-center"
              aria-hidden="true"
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "var(--accent-blue-soft)",
                border: "1px solid var(--accent-blue-line)",
                color: "var(--accent-blue)",
              }}
            >
              <Mail size={20} />
            </span>
            <span className="ui-label">email</span>
            <span
              className="ui-row-title"
              style={{ fontSize: 20, fontWeight: 600, color: "var(--text-primary)", overflowWrap: "anywhere" }}
            >
              {email}
            </span>
          </a>
        ) : null}

        {links.length > 0 ? (
          <div className="ui-card flex flex-col" style={{ padding: "12px 0" }}>
            <span className="ui-label" style={{ padding: "12px 28px" }}>
              elsewhere
            </span>
            {links.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="ui-row-link flex items-center justify-between gap-4"
                style={{ padding: "14px 28px", borderTop: "1px solid var(--border-muted)" }}
              >
                <span className="ui-row-title" style={{ fontSize: 16, fontWeight: 500, color: "var(--text-primary)" }}>
                  {link.label}
                </span>
                <ArrowUpRight size={16} aria-hidden="true" style={{ color: "var(--text-dim)" }} />
              </a>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
