/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink, MapPin, Code2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/supabase/errors";
import { getSeoMetadata } from "@/lib/seo";
import type { Tables } from "@/types/database";

function formatMonthYear(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(date);
}

function oneLine(text: string | null | undefined) {
  if (!text) return "";
  return text.replace(/\s+/g, " ").trim();
}

function splitNarrative(text: string | null | undefined) {
  const content = (text ?? "").trim();
  if (!content) return [];

  const blocks = content
    .split(/\n{2,}/)
    .map((block) => block.replace(/\n/g, " ").trim())
    .filter(Boolean);

  return blocks.length > 0 ? blocks : [content];
}

type AboutCollectionRow = {
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

type SkillGroup = {
  id: string;
  group_title: string;
  items: string[];
};

const FALLBACK_FOCUS_AREAS: AboutCollectionRow[] = [
  {
    id: "focus-web-app-sec",
    title: "Web Application Security",
    description: "Finding and analyzing vulnerabilities in modern web applications.",
    icon: null,
    display_order: 1,
    visible: true,
  },
  {
    id: "focus-vuln-discovery",
    title: "Vulnerability Discovery and Analysis",
    description: "Researching and identifying security weaknesses.",
    icon: null,
    display_order: 2,
    visible: true,
  },
  {
    id: "focus-research-dev",
    title: "Security Research and PoC Development",
    description: "Building reproducible insights and secure engineering patterns.",
    icon: null,
    display_order: 3,
    visible: true,
  },
  {
    id: "focus-reverse",
    title: "Reverse Engineering",
    description: "Understanding software behavior and internal logic.",
    icon: null,
    display_order: 4,
    visible: true,
  },
  {
    id: "focus-code-review",
    title: "Secure Code Review",
    description: "Reviewing implementation details with a threat-aware mindset.",
    icon: null,
    display_order: 5,
    visible: true,
  },
  {
    id: "focus-threat-modeling",
    title: "Threat Modeling",
    description: "Analyzing attack surfaces and security risks.",
    icon: null,
    display_order: 6,
    visible: true,
  },
];

const FALLBACK_INTERESTS: AboutCollectionRow[] = [
  {
    id: "interest-1",
    title: "system internals",
    description: "Exploring internals and complex behavior.",
    icon: null,
    display_order: 1,
    visible: true,
  },
  {
    id: "interest-2",
    title: "secure solutions",
    description: "Building secure solutions with modern tooling.",
    icon: null,
    display_order: 2,
    visible: true,
  },
  {
    id: "interest-3",
    title: "knowledge sharing",
    description: "Sharing practical learning with the community.",
    icon: null,
    display_order: 3,
    visible: true,
  },
];

function fallbackSkillGroups() {
  return [
    {
      id: "fallback-core",
      group_title: "core",
      items: [
        "Web Security",
        "Vulnerability Research",
        "Penetration Testing",
        "Reverse Engineering",
        "Burp Suite",
        "OWASP Top 10",
        "Linux",
        "Python",
        "Bash",
        "Git",
      ],
    },
  ];
}

export async function generateMetadata(): Promise<Metadata> {
  return getSeoMetadata("about");
}

export default async function AboutPage() {
  const supabase = createClient();

  const [
    aboutResult,
    profileResult,
    timelineResult,
    educationResult,
    focusResult,
    interestsResult,
    skillGroupsResult,
    socialLinksResult,
  ] = await Promise.all([
    supabase.from("about_settings").select("*").maybeSingle(),
    supabase
      .from("profile")
      .select("name,username,bio,location,profile_picture_url,availability_status,availability_text,skills,github_url,linkedin_url,twitter_url")
      .maybeSingle(),
    supabase
      .from("career_timeline")
      .select("id,title,organization,description,start_date,end_date,is_current,type,display_order")
      .order("display_order", { ascending: true }),
    supabase
      .from("education_entries")
      .select("id,school_name,degree,field_of_study,school_url,logo_url,location,start_date,end_date,is_current,description")
      .order("display_order", { ascending: true }),
    (supabase as any).from("about_focus_areas").select("*").eq("visible", true).order("display_order", { ascending: true }),
    (supabase as any).from("about_interests").select("*").eq("visible", true).order("display_order", { ascending: true }),
    (supabase as any).from("about_skill_groups").select("*").eq("visible", true).order("display_order", { ascending: true }),
    (supabase as any).from("social_links").select("*").eq("visible", true).order("display_order", { ascending: true }),
  ]);

  const educationMissing = isMissingTableError(educationResult.error, "education_entries");
  const focusMissing = isMissingTableError(focusResult.error ?? null, "about_focus_areas");
  const interestsMissing = isMissingTableError(interestsResult.error ?? null, "about_interests");
  const skillsMissing = isMissingTableError(skillGroupsResult.error ?? null, "about_skill_groups");
  const socialLinksMissing = isMissingTableError(socialLinksResult.error ?? null, "social_links");

  if (
    aboutResult.error ||
    profileResult.error ||
    timelineResult.error ||
    (educationResult.error && !educationMissing) ||
    (focusResult.error && !focusMissing) ||
    (interestsResult.error && !interestsMissing) ||
    (skillGroupsResult.error && !skillsMissing) ||
    (socialLinksResult.error && !socialLinksMissing)
  ) {
    return null;
  }

  const about = (aboutResult.data as Tables<"about_settings"> | null) ?? null;
  const profile =
    (profileResult.data as Pick<
      Tables<"profile">,
      "name" | "username" | "bio" | "location" | "profile_picture_url" | "availability_status" | "availability_text" | "skills" | "github_url" | "linkedin_url" | "twitter_url"
    > | null) ?? null;

  const timeline = (timelineResult.data as Tables<"career_timeline">[] | null) ?? [];
  const education = (educationResult.data as Tables<"education_entries">[] | null) ?? [];
  const focusAreas = (focusResult.data as AboutCollectionRow[] | null) ?? [];
  const interests = (interestsResult.data as AboutCollectionRow[] | null) ?? [];
  const skillGroupsTable = (skillGroupsResult.data as AboutSkillGroupRow[] | null) ?? [];
  const socialLinks = ((socialLinksResult.data as Array<{ id: string; label: string; url: string }> | null) ?? []);

  const experienceEntries = timeline.filter((item) => {
    const type = oneLine(item.type).toLowerCase();
    return type === "" || type === "experience" || type === "work";
  });

  const finalFocus = focusAreas.length > 0 ? focusAreas : FALLBACK_FOCUS_AREAS;
  const finalInterests = interests.length > 0 ? interests : FALLBACK_INTERESTS;

  const narrativeBlocks = splitNarrative(about?.biography || profile?.bio || null);

  const finalSkillGroups: SkillGroup[] =
    skillGroupsTable.length > 0
      ? skillGroupsTable.map((group) => ({
          id: group.id,
          group_title: group.group_title,
          items: (group.items ?? []).filter(Boolean),
        }))
      : fallbackSkillGroups();

  const coreSkills = Array.from(
    new Set(
      finalSkillGroups
        .flatMap((group) => group.items)
        .map((item) => oneLine(item))
        .filter(Boolean)
    )
  ).slice(0, 12);

  const focusItems = finalFocus
    .map((item) => oneLine(item.title))
    .filter(Boolean)
    .slice(0, 6);

  const interestsSummary =
    finalInterests
      .map((item) => oneLine(item.description || item.title))
      .filter(Boolean)
      .slice(0, 3)
      .join(" ") ||
    "Exploring system internals, breaking down complex applications, and building secure solutions while sharing knowledge with the community.";

  const intro =
    oneLine(about?.hero_text) ||
    oneLine(profile?.bio) ||
    "Passionate about solving real-world problems through code and securing modern technologies.";

  const mission =
    narrativeBlocks[0] ||
    "I build, break, and harden systems with a practical mindset focused on real impact.";

  const username = oneLine(profile?.username) || "0x7hierri";
  const location = oneLine(profile?.location) || "Kigali, Rwanda";

  const socials =
    socialLinks.length > 0
      ? socialLinks
          .map((item) => ({ label: oneLine(item.label), url: oneLine(item.url) }))
          .filter((entry): entry is { label: string; url: string } => Boolean(entry.url))
      : [
          { label: "github", url: oneLine(profile?.github_url) },
          { label: "x", url: oneLine(profile?.twitter_url) },
          { label: "linkedin", url: oneLine(profile?.linkedin_url) },
        ].filter((entry): entry is { label: string; url: string } => Boolean(entry.url));

  const githubUrl =
    oneLine(profile?.github_url) ||
    socials.find((item) => item.label.toLowerCase().includes("github"))?.url ||
    "";

  return (
    <section className="relative mx-auto max-w-[1040px] px-4 pb-14 pt-10 sm:px-6 sm:pt-12 lg:px-8 lg:pt-14">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-36"
        style={{ background: "radial-gradient(ellipse at top, rgba(16,69,132,0.18), rgba(2,6,11,0))" }}
      />

      <header className="relative grid gap-5 pb-8 sm:gap-6 sm:pb-9 lg:grid-cols-[minmax(0,1.18fr)_minmax(190px,0.72fr)] lg:items-start">
        <div className="min-w-0">
          {profile?.availability_status ? (
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] px-2.5 py-1 text-[10px] text-[var(--text-muted)]">
              <span className="h-2 w-2 rounded-full bg-[#3fb950]" />
              {oneLine(profile?.availability_text) || "Available for collaboration"}
            </div>
          ) : null}

          <h1 className="text-[clamp(32px,5.4vw,50px)] font-medium leading-[1.02] tracking-[-0.02em] text-[var(--text-primary)]">
            About Me
          </h1>

          <p className="mt-3 max-w-[56ch] text-[14px] leading-[1.75] text-[var(--text-body)] sm:text-[15px]">
            {intro}
          </p>
          <p className="mt-2.5 max-w-[56ch] text-[12px] leading-[1.75] text-[var(--text-muted)] sm:text-[13px] sm:leading-[1.82]">
            {mission}
          </p>

          <details className="mt-4 rounded-lg border border-[color:var(--border)] bg-[var(--bg-surface)]/80 p-2.5 lg:hidden">
            <summary className="cursor-pointer list-none rounded-md border border-[color:var(--border)] px-3 py-2 text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
              Toggle profile
            </summary>

            <div className="mt-3 flex items-center gap-3 px-1">
              <div className="h-16 w-16 overflow-hidden rounded-full border border-[color:var(--border)] bg-[var(--bg-surface)]">
                {profile?.profile_picture_url ? (
                  <img src={profile.profile_picture_url} alt={username} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-mono text-2xl text-[var(--accent-blue)]">0x</div>
                )}
              </div>

              <div className="min-w-0">
                <div className="truncate font-mono text-[18px] leading-none text-[var(--text-primary)]">{username}</div>
                <div className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                  <MapPin size={12} />
                  <span className="truncate">{location}</span>
                </div>
              </div>
            </div>
          </details>
        </div>

        <div className="hidden flex-col items-start gap-2 lg:flex lg:items-end">
          <div className="h-24 w-24 overflow-hidden rounded-full border border-[color:var(--border)] bg-[var(--bg-surface)] xl:h-28 xl:w-28">
            {profile?.profile_picture_url ? (
              <img src={profile.profile_picture_url} alt={username} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-mono text-3xl text-[var(--accent-blue)]">
                0x
              </div>
            )}
          </div>

          <div className="font-mono text-[19px] leading-none text-[var(--text-primary)] xl:text-[21px]">{username}</div>
          <div className="inline-flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
            <MapPin size={12} />
            {location}
          </div>
        </div>
      </header>

      <section className="mt-8 rounded-xl border border-[color:var(--border)] bg-[var(--bg-surface)] px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex gap-3 sm:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-elevated)] text-[var(--accent-blue)]">
            <Code2 size={17} />
          </div>

          <div className="min-w-0">
            <h2 className="text-[24px] font-medium tracking-[-0.015em] text-[var(--accent-blue)]">My Journey</h2>
            <div className="mt-2.5 grid gap-3">
              {(narrativeBlocks.length > 0 ? narrativeBlocks : [mission]).map((paragraph, index) => (
                <p key={`${paragraph}-${index}`} className="text-[13px] leading-7 text-[var(--text-muted)]">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-[color:var(--border)] bg-[var(--bg-surface)] px-4 py-4 sm:px-5 sm:py-5">
          <h3 className="text-[24px] font-medium tracking-[-0.015em] text-[var(--accent-blue)]">Experience</h3>

          <div className="mt-4 grid gap-4">
            {experienceEntries.length > 0 ? (
              experienceEntries.map((entry) => {
                const start = formatMonthYear(entry.start_date);
                const end = entry.is_current ? "Present" : formatMonthYear(entry.end_date);

                return (
                  <div key={entry.id} className="rounded-lg border border-[color:var(--border)] bg-[var(--bg-card)] px-3.5 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h4 className="text-[18px] font-medium leading-tight text-[var(--text-primary)]">{entry.title}</h4>
                      {(start || end) ? (
                        <span className="rounded-full border border-[#3fb95066] bg-[#3fb9501a] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[#3fb950]">
                          {`${start ?? ""}${start && end ? " - " : ""}${end ?? ""}`}
                        </span>
                      ) : null}
                    </div>

                    {entry.organization ? (
                      <p className="mt-1 text-[13px] text-[var(--accent-blue)]">{entry.organization}</p>
                    ) : null}

                    {entry.description ? (
                      <p className="mt-2 text-[13px] leading-6 text-[var(--text-muted)]">{entry.description}</p>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <p className="text-[13px] text-[var(--text-muted)]">No experience entries yet. Add them from Admin / About.</p>
            )}
          </div>
        </article>

        <article className="rounded-xl border border-[color:var(--border)] bg-[var(--bg-surface)] px-4 py-4 sm:px-5 sm:py-5">
          <h3 className="text-[24px] font-medium tracking-[-0.015em] text-[var(--accent-blue)]">Education</h3>

          <div className="mt-4 grid gap-4">
            {education.length > 0 ? (
              education.map((entry) => {
                const start = formatMonthYear(entry.start_date);
                const end = entry.is_current ? "Present" : formatMonthYear(entry.end_date);

                return (
                  <div key={entry.id} className="rounded-lg border border-[color:var(--border)] bg-[var(--bg-card)] px-3.5 py-3">
                    <div className="flex gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[color:var(--border)] bg-[var(--bg-surface)]">
                        {entry.logo_url ? (
                          <img src={entry.logo_url} alt={`${entry.school_name} logo`} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-[10px] text-[var(--accent-blue)]">logo</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            {entry.school_url ? (
                              <a
                                href={entry.school_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[18px] font-medium leading-tight text-[var(--text-primary)] transition-colors hover:text-[var(--accent-blue)]"
                              >
                                {entry.school_name}
                              </a>
                            ) : (
                              <h4 className="text-[18px] font-medium leading-tight text-[var(--text-primary)]">{entry.school_name}</h4>
                            )}

                            {(entry.degree || entry.field_of_study) ? (
                              <p className="mt-1 text-[13px] text-[var(--accent-blue)]">
                                {[entry.degree, entry.field_of_study].filter(Boolean).join(" - ")}
                              </p>
                            ) : null}
                          </div>

                          {(start || end) ? (
                            <span className="text-[10px] text-[var(--text-muted)]">
                              {`${start ?? ""}${start && end ? " - " : ""}${end ?? ""}`}
                            </span>
                          ) : null}
                        </div>

                        {entry.description ? (
                          <p className="mt-2 text-[13px] leading-6 text-[var(--text-muted)]">{entry.description}</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-[13px] text-[var(--text-muted)]">No education entries yet. Add them from Admin / About.</p>
            )}
          </div>
        </article>
      </section>

      <section className="mt-4 rounded-xl border border-[color:var(--border)] bg-[var(--bg-surface)] px-4 py-4 sm:px-5 sm:py-5">
        <div className="grid gap-5 lg:grid-cols-3">
          <div>
            <h3 className="text-[23px] font-medium tracking-[-0.015em] text-[var(--accent-blue)]">Core Skills</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {coreSkills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-md border border-[color:var(--border)] bg-[var(--bg-card)] px-2.5 py-1 text-[10px] text-[var(--text-muted)]"
                >
                  {skill}
                </span>
              ))}
            </div>
            <p className="mt-4 text-[12px] text-[var(--text-muted)]">Always learning. Always hacking.</p>
          </div>

          <div className="border-t border-[color:var(--border)] pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
            <h3 className="text-[23px] font-medium tracking-[-0.015em] text-[var(--accent-blue)]">Focus Areas</h3>
            <ul className="mt-3 space-y-2">
              {focusItems.map((item) => (
                <li key={item} className="flex items-start gap-2 text-[13px] text-[var(--text-muted)]">
                  <span className="mt-[2px] inline-flex h-4 w-4 items-center justify-center rounded-full border border-[color:var(--accent-blue)] text-[10px] text-[var(--accent-blue)]">
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-[color:var(--border)] pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
            <h3 className="text-[23px] font-medium tracking-[-0.015em] text-[var(--accent-blue)]">What I&apos;m Interested In</h3>
            <p className="mt-3 text-[13px] leading-7 text-[var(--text-muted)]">
              {interestsSummary}
            </p>
            <Link
              href="/blog"
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[color:var(--border)] px-3 py-1.5 text-[11px] text-[var(--text-muted)] transition-colors hover:border-[color:var(--accent-blue)] hover:text-[var(--text-primary)]"
            >
              Read my blog
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-xl border border-[color:var(--border)] px-4 py-4 sm:px-5 sm:py-5" style={{ background: "var(--bg-surface)" }}>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <h2 className="text-[22px] font-medium leading-tight tracking-[-0.015em] text-[var(--text-primary)]">
              Let&apos;s connect and build something secure together.
            </h2>
            <p className="mt-2 text-[13px] leading-7 text-[var(--text-muted)]">
              I&apos;m always open to interesting projects and collaborations.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-[color:var(--border)] px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)] transition-colors hover:border-[color:var(--accent-blue)] hover:text-[var(--text-primary)]"
                >
                  {social.label}
                </a>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-blue)] px-3.5 py-2 text-[11px] uppercase tracking-[0.08em] text-[var(--text-on-accent)] transition-transform duration-200 hover:-translate-y-0.5"
            >
              Get in touch
              <ArrowRight size={12} />
            </Link>

            {githubUrl ? (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--border)] px-3.5 py-2 text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)] transition-colors hover:border-[color:var(--accent-blue)] hover:text-[var(--text-primary)]"
              >
                GitHub
                <ExternalLink size={12} />
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mt-6 text-center">
        <div className="text-[12px] text-[var(--text-dim)]">Security is not a product, but a process.</div>
        <div className="mt-1 text-[12px] text-[var(--text-dim)]">Keep learning. Keep hacking. Keep building.</div>
      </section>
    </section>
  );
}
