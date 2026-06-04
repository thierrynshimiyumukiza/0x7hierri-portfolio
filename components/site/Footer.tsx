import { Github, Rss, Twitter } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export default async function Footer() {
  const supabase = createClient();

  const [{ data: profileData, error: profileError }] =
    await Promise.all([
      supabase
        .from("profile")
        .select("github_url,twitter_url")
        .maybeSingle(),
    ]);

  const profile = (profileData as Pick<Tables<"profile">, "github_url" | "twitter_url"> | null) ?? null;

  if (profileError) {
    return null;
  }

  const socialLinks = [
    {
      key: "github",
      href: profile?.github_url || "https://github.com",
      icon: Github,
      label: "github",
    },
    {
      key: "twitter",
      href: profile?.twitter_url || "https://x.com",
      icon: Twitter,
      label: "twitter",
    },
    {
      key: "rss",
      href: "/blog",
      icon: Rss,
      label: "rss",
    },
  ];

  return (
    <footer
      style={{
        padding: "1.2rem 2rem",
        borderTop: "0.5px solid var(--bg-elevated)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "var(--bg-base)",
      }}
    >
      <p
        style={{
          fontSize: "10.5px",
          color: "var(--text-faint)",
          fontFamily: "var(--font-mono), monospace",
        }}
      >
        0x7hierri · next.js + supabase
      </p>

      {socialLinks.length > 0 ? (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {socialLinks.map((item) => {
            const Icon = item.icon;

            return (
            <a
              key={item.key}
              href={item.href}
              target={item.href.startsWith("http") ? "_blank" : undefined}
              rel={item.href.startsWith("http") ? "noreferrer" : undefined}
              style={{
                fontSize: "18px",
                color: "var(--text-faint)",
                textDecoration: "none",
                lineHeight: 1,
                transition: "color 0.15s",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              className="footer-icon-link"
              aria-label={item.label}
              title={item.label}
            >
              <Icon size={18} strokeWidth={1.6} />
            </a>
            );
          })}
        </div>
      ) : null}
    </footer>
  );
}
