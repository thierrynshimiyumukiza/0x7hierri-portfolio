import type { Metadata } from "next";
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
    profile?.github_url,
    profile?.linkedin_url,
    profile?.twitter_url,
    profile?.website_url,
  ].filter((link): link is string => Boolean(link));

  const email = profile?.email ?? footer?.contact_email;

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <article className="surface-card space-y-4">
        {email ? (
          <a href={`mailto:${email}`} className="block text-lg text-[--accent-blue]">
            {email}
          </a>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {links.map((url) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-[--border] px-3 py-1 font-mono text-[10px] text-[--text-dim]"
            >
              {url}
            </a>
          ))}
        </div>
      </article>
    </section>
  );
}
