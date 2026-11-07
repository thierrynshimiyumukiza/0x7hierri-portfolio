import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export default async function Footer() {
  const supabase = createClient();

  const { data: profileData } = await supabase
    .from("profile")
    .select("github_url,twitter_url,linkedin_url")
    .maybeSingle();

  const profile =
    (profileData as Pick<Tables<"profile">, "github_url" | "twitter_url" | "linkedin_url"> | null) ?? null;

  const links = [
    { label: "rss", href: "/blog/rss.xml" },
    { label: "github", href: profile?.github_url },
    { label: "twitter", href: profile?.twitter_url },
    { label: "linkedin", href: profile?.linkedin_url },
  ].filter((link): link is { label: string; href: string } => Boolean(link.href));

  return (
    <footer className="ui-footer">
      <div className="ui-wrap ui-footer-inner">
        <p className="ui-mono" style={{ fontSize: 13, color: "var(--text-dim)" }}>
          © {new Date().getFullYear()} 0x7hierri · built with next.js + supabase
        </p>

        <nav aria-label="Footer" className="ui-mono flex flex-wrap gap-[18px]" style={{ fontSize: 13 }}>
          {links.map((link) => {
            const external = link.href.startsWith("http");
            return (
              <a
                key={link.label}
                href={link.href}
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer" : undefined}
              >
                {link.label}
              </a>
            );
          })}
        </nav>
      </div>
    </footer>
  );
}
