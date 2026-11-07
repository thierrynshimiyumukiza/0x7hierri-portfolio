/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { Award, MapPin } from "lucide-react";
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
    certificationsResult,
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
    supabase
      .from("certifications")
      .select("id,name,issuer,date_earned,url")
      .order("display_order", { ascending: true }),
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

  const certifications =
    (certificationsResult.data as Pick<Tables<"certifications">, "id" | "name" | "issuer" | "date_earned" | "url">[] | null) ?? [];

  // Work and study read as one story, newest first.
  type JourneyItem = {
    id: string;
    kind: "work" | "education";
    title: string;
    org: string;
    orgUrl: string | null;
    period: string;
    current: boolean;
    description: string;
    sortKey: number;
  };

  const period = (start: string | null, end: string | null, current: boolean | null) => {
    const from = formatMonthYear(start);
    const to = current ? "present" : formatMonthYear(end);
    return [from, to].filter(Boolean).join(" — ");
  };

  const journey: JourneyItem[] = [
    ...experienceEntries.map((item) => ({
      id: item.id,
      kind: "work" as const,
      title: oneLine(item.title),
      org: oneLine(item.organization),
      orgUrl: null,
      period: period(item.start_date, item.end_date, item.is_current),
      current: Boolean(item.is_current),
      description: oneLine(item.description),
      sortKey: item.start_date ? new Date(item.start_date).getTime() : 0,
    })),
    ...education.map((item) => ({
      id: item.id,
      kind: "education" as const,
      title:
        [oneLine(item.degree), oneLine(item.field_of_study)].filter(Boolean).join(" · ") || oneLine(item.school_name),
      org: oneLine(item.school_name),
      orgUrl: oneLine(item.school_url) || null,
      period: period(item.start_date, item.end_date, item.is_current),
      current: Boolean(item.is_current),
      description: oneLine(item.description),
      sortKey: item.start_date ? new Date(item.start_date).getTime() : 0,
    })),
  ].sort((a, b) => b.sortKey - a.sortKey);

  const currentRole = journey.find((item) => item.kind === "work" && item.current);
  const currentSchool = journey.find((item) => item.kind === "education" && item.current);
  const avatar = oneLine(about?.profile_image_url) || oneLine(profile?.profile_picture_url);
  const available = Boolean(profile?.availability_status);

  return (
    <div className="ui-page">
      <section
        className="ui-wrap"
        style={{ paddingTop: 80, paddingBottom: 64, display: "flex", flexWrap: "wrap", gap: 48, alignItems: "flex-start" }}
      >
        <div className="flex flex-col gap-6" style={{ flex: "999 1 560px", minWidth: 0 }}>
          <p className="ui-label">$ cat about.md</p>
          <h1 className="ui-h1" style={{ fontSize: "clamp(34px, 4.4vw, 54px)" }}>
            {intro}
          </h1>
          {narrativeBlocks.length > 0 ? (
            <div className="flex flex-col gap-4">
              {narrativeBlocks.map((block) => (
                <p key={block.slice(0, 48)} className="ui-lead" style={{ fontSize: 19, lineHeight: 1.7 }}>
                  {block}
                </p>
              ))}
            </div>
          ) : (
            <p className="ui-lead">{mission}</p>
          )}
          <div className="flex flex-wrap gap-3">
            <Link href="/contact" className="ui-btn ui-btn-primary">
              Get in touch
            </Link>
            {githubUrl ? (
              <a href={githubUrl} target="_blank" rel="noreferrer" className="ui-btn">
                GitHub
              </a>
            ) : null}
          </div>
        </div>

        <aside className="ui-card flex flex-col gap-5" style={{ flex: "1 1 300px", padding: 28 }}>
          <div className="flex items-center gap-4">
            {avatar ? (
              <img
                src={avatar}
                alt={`${username} profile photo`}
                width={72}
                height={72}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "1px solid var(--border-strong)",
                  background: "var(--bg-elevated)",
                }}
              />
            ) : null}
            <div className="min-w-0">
              <div className="ui-mono" style={{ fontSize: 18, fontWeight: 500, color: "var(--text-primary)" }}>
                {username}
              </div>
              <div className="flex items-center gap-1.5" style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>
                <MapPin size={14} aria-hidden="true" />
                {location}
              </div>
            </div>
          </div>

          <dl className="flex flex-col gap-3" style={{ fontSize: 15 }}>
            {currentRole ? (
              <div className="flex justify-between gap-3">
                <dt style={{ color: "var(--text-muted)" }}>Role</dt>
                <dd className="text-right" style={{ color: "var(--text-primary)" }}>
                  {currentRole.title}
                </dd>
              </div>
            ) : null}
            {currentSchool ? (
              <div className="flex justify-between gap-3">
                <dt style={{ color: "var(--text-muted)" }}>Studying</dt>
                <dd className="text-right" style={{ color: "var(--text-primary)" }}>
                  {currentSchool.org}
                </dd>
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-3">
              <dt style={{ color: "var(--text-muted)" }}>Status</dt>
              <dd
                className="flex items-center gap-2 text-right"
                style={{ color: available ? "var(--accent-green)" : "var(--text-muted)" }}
              >
                {available ? <span className="ui-dot" aria-hidden="true" /> : null}
                {available ? oneLine(profile?.availability_text) || "open to collaborate" : "not taking new work"}
              </dd>
            </div>
          </dl>

          {socials.length > 0 ? (
            <div className="flex flex-wrap gap-2" style={{ borderTop: "1px solid var(--border)", paddingTop: 18 }}>
              {socials.map((item) => (
                <a key={item.url} href={item.url} target="_blank" rel="noreferrer" className="ui-tag">
                  {item.label.toLowerCase()}
                </a>
              ))}
            </div>
          ) : null}
        </aside>
      </section>

      {journey.length > 0 ? (
        <section className="ui-wrap" style={{ paddingBottom: 72 }}>
          <h2 className="ui-h2" style={{ marginBottom: 28 }}>
            Journey
          </h2>
          <ol style={{ listStyle: "none", borderLeft: "1px solid var(--border-strong)", marginLeft: 8 }}>
            {journey.map((item, index) => (
              <li
                key={item.id}
                style={{ position: "relative", padding: index === journey.length - 1 ? "0 0 0 32px" : "0 0 36px 32px" }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: -6,
                    top: 6,
                    width: 11,
                    height: 11,
                    borderRadius: "50%",
                    background: item.current ? "var(--accent-blue)" : "var(--border-strong)",
                    boxShadow: "0 0 0 4px var(--bg-base)",
                  }}
                />
                <div
                  className="ui-mono flex flex-wrap gap-x-3"
                  style={{ fontSize: 13, color: item.current ? "var(--accent-blue)" : "var(--text-muted)" }}
                >
                  {item.period ? <span>{item.period}</span> : null}
                  <span style={{ color: "var(--text-dim)" }}>{item.kind === "work" ? "work" : "education"}</span>
                </div>
                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1" style={{ marginTop: 6 }}>
                  <h3 style={{ fontSize: 21, fontWeight: 600, color: "var(--text-primary)" }}>{item.title}</h3>
                  {item.org && item.org !== item.title ? (
                    item.orgUrl ? (
                      <a href={item.orgUrl} target="_blank" rel="noreferrer" className="ui-link">
                        {item.org}
                      </a>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>at {item.org}</span>
                    )
                  ) : null}
                </div>
                {item.description ? (
                  <p style={{ marginTop: 10, color: "var(--text-body)", lineHeight: 1.65, maxWidth: "44em" }}>
                    {item.description}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {finalSkillGroups.length > 0 ? (
        <section className="ui-wrap" style={{ paddingBottom: 72 }}>
          <h2 className="ui-h2" style={{ marginBottom: 24 }}>
            What I work with
          </h2>
          <div className="ui-grid-auto" style={{ ["--ui-min" as string]: "260px", ["--ui-gap" as string]: "16px" }}>
            {finalSkillGroups.map((group) => (
              <div key={group.id} className="ui-card" style={{ padding: 24 }}>
                <div className="ui-label">{group.group_title}</div>
                <div className="flex flex-wrap gap-2" style={{ marginTop: 16 }}>
                  {group.items.map((item) => (
                    <span key={item} className="ui-tag">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {finalFocus.length > 0 ? (
        <section className="ui-wrap" style={{ paddingBottom: 72 }}>
          <h2 className="ui-h2" style={{ marginBottom: 24 }}>
            Focus areas
          </h2>
          <div className="ui-grid-auto" style={{ ["--ui-min" as string]: "300px", ["--ui-gap" as string]: "16px" }}>
            {finalFocus.map((item) => (
              <div key={item.id} className="ui-card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)" }}>{oneLine(item.title)}</h3>
                {item.description ? (
                  <p style={{ marginTop: 8, color: "var(--text-muted)", lineHeight: 1.6, fontSize: 15 }}>
                    {oneLine(item.description)}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {certifications.length > 0 ? (
        <section className="ui-wrap" style={{ paddingBottom: 72 }}>
          <h2 className="ui-h2" style={{ marginBottom: 24 }}>
            Certifications
          </h2>
          <div className="ui-grid-auto" style={{ ["--ui-min" as string]: "340px", ["--ui-gap" as string]: "16px" }}>
            {certifications.map((cert) => (
              <div key={cert.id} className="ui-card flex items-center gap-4" style={{ padding: "22px 24px" }}>
                <span
                  className="flex flex-none items-center justify-center"
                  aria-hidden="true"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: "var(--accent-blue-soft)",
                    border: "1px solid var(--accent-blue-line)",
                    color: "var(--accent-blue)",
                  }}
                >
                  <Award size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>{cert.name}</div>
                  <div className="ui-mono" style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                    {[cert.issuer, formatMonthYear(cert.date_earned)].filter(Boolean).join(" · ")}
                  </div>
                </div>
                {cert.url ? (
                  <a href={cert.url} target="_blank" rel="noreferrer" className="ui-link ui-mono" style={{ fontSize: 13 }}>
                    verify ↗
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="ui-wrap" style={{ paddingBottom: 96 }}>
        <div
          className="ui-card flex flex-wrap items-center justify-between gap-6"
          style={{ padding: 40, borderColor: "var(--accent-blue-line)" }}
        >
          <div style={{ flex: "1 1 320px" }}>
            <h2 className="ui-h2">Working on something interesting?</h2>
            <p style={{ marginTop: 10, color: "var(--text-body)", fontSize: 17, lineHeight: 1.6 }}>{interestsSummary}</p>
          </div>
          <Link href="/contact" className="ui-btn ui-btn-primary">
            Say hello
          </Link>
        </div>
      </section>
    </div>
  );
}
