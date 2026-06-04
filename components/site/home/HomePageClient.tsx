"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BookOpen, Bug, Code2, Cpu, Network, SearchCheck, Shield } from "lucide-react";

type HeroData = {
  heading_line1: string;
  heading_line2: string;
  heading_line3: string;
  subheading: string;
  description: string;
  cta_primary_text: string;
  cta_primary_url: string;
  cta_secondary_text: string;
  cta_secondary_url: string;
  show_availability: boolean;
  availability_text: string;
};

type ProfileData = {
  profile_picture_url: string | null;
  username: string;
  location: string;
  bio: string;
  availability_status: boolean;
  availability_text: string;
  github_url: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
};

type StatData = {
  id: string;
  number: string;
  label: string;
};

type FeedItem = {
  id: string;
  type: "project" | "study" | "blog";
  title: string;
  description: string;
  thumbnail_url: string | null;
  tags: string[];
  url: string;
  meta: string;
  date: string;
  progress?: number;
};

type LiveItem = {
  type: "published" | "updated" | "in_progress";
  title: string;
  url: string;
  date: string;
};

type ExpertiseItem = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

type HomepageSettings = {
  about_preview_title: string;
  about_preview_text: string;
  about_preview_button_text: string;
  about_preview_url: string;
};

type SocialLink = {
  id: string;
  label: string;
  url: string;
};

const personas = [
  { id: "all", label: "all" },
  { id: "recruiter", label: "recruiter" },
  { id: "collaborator", label: "collaborator" },
  { id: "learner", label: "learner" },
  { id: "builder", label: "builder" },
] as const;

type PersonaId = (typeof personas)[number]["id"];

function filterByPersona(items: FeedItem[], persona: PersonaId): FeedItem[] {
  if (persona === "all") {
    return items;
  }

  if (persona === "recruiter") {
    return items.filter((item) => item.type === "project" || item.type === "blog");
  }

  if (persona === "collaborator") {
    return items.filter((item) => item.type === "project" || item.type === "study");
  }

  if (persona === "learner") {
    return items.filter((item) => item.type === "study" || item.type === "blog");
  }

  return items.filter((item) => item.type === "project");
}

function statusDotColor(status: LiveItem["type"]): string {
  if (status === "published") return "var(--accent-green)";
  if (status === "updated") return "var(--accent-amber)";
  return "var(--accent-blue)";
}

function typeBadge(type: FeedItem["type"]): { label: string; color: string; background: string } {
  if (type === "project") {
    return { label: "prj", color: "var(--accent-green)", background: "rgba(63,185,80,0.15)" };
  }

  if (type === "study") {
    return { label: "std", color: "var(--accent-blue)", background: "rgba(88,166,255,0.15)" };
  }

  return { label: "blg", color: "var(--accent-purple)", background: "rgba(210,168,255,0.15)" };
}

function resolveExpertiseIcon(icon: string) {
  const key = icon.trim().toLowerCase();

  if (key.includes("shield") || key.includes("security")) return Shield;
  if (key.includes("bug") || key.includes("vuln")) return Bug;
  if (key.includes("reverse") || key.includes("code")) return Code2;
  if (key.includes("research") || key.includes("search")) return SearchCheck;
  if (key.includes("system") || key.includes("cpu")) return Cpu;
  if (key.includes("network") || key.includes("threat")) return Network;
  return BookOpen;
}

export default function HomePageClient({
  hero,
  profile,
  stats,
  feedItems,
  liveItems,
  aboutLink,
  expertiseItems,
  homepageSettings,
  socialLinks,
}: {
  hero: HeroData;
  profile: ProfileData;
  stats: StatData[];
  feedItems: FeedItem[];
  liveItems: LiveItem[];
  aboutLink: string;
  expertiseItems: ExpertiseItem[];
  homepageSettings: HomepageSettings;
  socialLinks: SocialLink[];
}) {
  const [activePersona, setActivePersona] = useState<PersonaId>("all");

  const filteredItems = useMemo(() => {
    const filtered = filterByPersona(feedItems, activePersona);
    if (filtered.length > 0) {
      return filtered;
    }

    return feedItems;
  }, [activePersona, feedItems]);

  const finalSocialLinks = socialLinks.length > 0
    ? socialLinks
    : [
        profile.github_url ? { id: "github", label: "github", url: profile.github_url } : null,
        profile.twitter_url ? { id: "x", label: "x", url: profile.twitter_url } : null,
        profile.linkedin_url ? { id: "linkedin", label: "linkedin", url: profile.linkedin_url } : null,
      ].filter((item): item is SocialLink => Boolean(item));

  return (
    <>
      <section
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "4.5rem 2rem 3rem",
        }}
      >
        <div
          className="home-hero-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 240px",
            gap: "3rem",
            alignItems: "start",
          }}
        >
          <div className="animate-fade-up delay-1">
            {hero.show_availability ? (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  border: "0.5px solid var(--border)",
                  color: "var(--text-dim)",
                  fontSize: "11px",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  marginBottom: "1.8rem",
                  fontFamily: "var(--font-mono), monospace",
                  background: "transparent",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "var(--accent-green)",
                    flexShrink: 0,
                    animation: "pulse-dot 2s ease-in-out infinite",
                  }}
                />
                {hero.availability_text}
              </div>
            ) : null}

            <h1
              style={{
                fontSize: "clamp(30px, 4vw, 44px)",
                fontWeight: 500,
                lineHeight: 1.08,
                letterSpacing: "-1.2px",
                marginBottom: "1.1rem",
                color: "var(--text-primary)",
              }}
            >
              <span style={{ display: "block", color: "var(--text-primary)" }}>{hero.heading_line1}</span>
              <span style={{ display: "block", color: "var(--accent-blue)" }}>{hero.heading_line2}</span>
              <span style={{ display: "block", color: "var(--text-dim)" }}>{hero.heading_line3}</span>
            </h1>

            <div
              style={{
                fontSize: "10.5px",
                fontFamily: "var(--font-mono), monospace",
                color: "var(--accent-blue)",
                letterSpacing: "1.3px",
                textTransform: "uppercase",
                marginBottom: "0.9rem",
              }}
            >
              {hero.subheading}
            </div>

            <p
              style={{
                fontSize: "14px",
                color: "var(--text-dim)",
                lineHeight: 1.75,
                maxWidth: "400px",
                marginBottom: "1.8rem",
              }}
            >
              {hero.description}
            </p>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <a
                href={hero.cta_primary_url}
                style={{
                  background: "var(--accent-blue)",
                  color: "var(--text-on-accent)",
                  fontSize: "12.5px",
                  fontWeight: 500,
                  padding: "8px 18px",
                  borderRadius: "6px",
                  textDecoration: "none",
                  transition: "opacity 0.15s ease, transform 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "0.85";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
              >
                {hero.cta_primary_text}
              </a>

              <a
                href={hero.cta_secondary_url}
                style={{
                  background: "transparent",
                  color: "var(--text-muted)",
                  fontSize: "12.5px",
                  padding: "8px 18px",
                  borderRadius: "6px",
                  border: "0.5px solid var(--border)",
                  textDecoration: "none",
                  transition: "border-color 0.15s ease, color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--text-faint)";
                  e.currentTarget.style.color = "var(--text-body)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--text-muted)";
                }}
              >
                {hero.cta_secondary_text}
              </a>

              {profile.github_url ? (
                <a
                  href={profile.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: "transparent",
                    color: "var(--text-muted)",
                    fontSize: "12.5px",
                    padding: "8px 14px",
                    borderRadius: "6px",
                    border: "0.5px solid var(--border)",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    transition: "border-color 0.15s ease, color 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--text-faint)";
                    e.currentTarget.style.color = "var(--text-body)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.color = "var(--text-muted)";
                  }}
                >
                  github ↗
                </a>
              ) : null}
            </div>
          </div>

          <div
            className="animate-slide-right delay-2 home-profile-card"
            style={{
              textAlign: "center",
              position: "sticky",
              top: "80px",
              alignSelf: "start",
            }}
          >
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                overflow: "hidden",
                margin: "0 auto 12px",
                border: "0.5px solid var(--border)",
                background: "var(--bg-elevated)",
                position: "relative",
              }}
            >
              {profile.profile_picture_url ? (
                <Image
                  src={profile.profile_picture_url}
                  alt={profile.username || "0x7hierri"}
                  fill
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: "16px",
                    color: "var(--accent-blue)",
                  }}
                >
                  0x
                </div>
              )}
            </div>

            <div
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--text-primary)",
                marginBottom: "3px",
                fontFamily: "var(--font-mono), monospace",
              }}
            >
              {profile.username || "0x7hierri"}
            </div>

            {profile.location ? (
              <div
                style={{
                  fontSize: "10.5px",
                  color: "var(--text-dim)",
                  fontFamily: "var(--font-mono), monospace",
                  marginBottom: "12px",
                }}
              >
                {profile.location}
              </div>
            ) : null}

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: profile.availability_status ? "rgba(63,185,80,0.1)" : "rgba(139,148,158,0.1)",
                border: `0.5px solid ${profile.availability_status ? "rgba(63,185,80,0.3)" : "var(--border)"}`,
                color: profile.availability_status ? "var(--accent-green)" : "var(--text-dim)",
                fontSize: "10px",
                padding: "4px 10px",
                borderRadius: "20px",
                marginBottom: "14px",
                fontFamily: "var(--font-mono), monospace",
              }}
            >
              <span
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: profile.availability_status ? "var(--accent-green)" : "var(--text-dim)",
                  animation: profile.availability_status ? "pulse-dot 2s ease-in-out infinite" : "none",
                }}
              />
              {profile.availability_text}
            </div>

            <div style={{ borderTop: "0.5px solid var(--bg-elevated)", margin: "0 0 12px" }} />

            <div style={{ display: "flex", justifyContent: "center", gap: "6px" }}>
              {[
                { url: profile.github_url, label: "gh" },
                { url: profile.twitter_url, label: "tw" },
                { url: profile.linkedin_url, label: "li" },
              ]
                .filter((social): social is { url: string; label: string } => Boolean(social.url))
                .map((social) => (
                  <a
                    key={social.label}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={social.label}
                    style={{
                      width: "30px",
                      height: "30px",
                      background: "var(--bg-elevated)",
                      border: "0.5px solid var(--border)",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--text-dim)",
                      textDecoration: "none",
                      fontSize: "11px",
                      fontFamily: "var(--font-mono), monospace",
                      transition: "border-color 0.15s ease, color 0.15s ease, background 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--text-faint)";
                      e.currentTarget.style.color = "var(--text-body)";
                      e.currentTarget.style.background = "var(--border)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.color = "var(--text-dim)";
                      e.currentTarget.style.background = "var(--bg-elevated)";
                    }}
                  >
                    {social.label}
                  </a>
                ))}
            </div>
          </div>
        </div>

        {stats.length > 0 ? (
          <div
            className="animate-fade-up delay-4 home-stats-row"
            style={{
              borderTop: "0.5px solid var(--bg-elevated)",
              paddingTop: "1.8rem",
              marginTop: "1.8rem",
              display: "flex",
              gap: 0,
              maxWidth: "calc(100% - 240px - 3rem)",
            }}
          >
            {stats.map((stat, index) => (
              <div
                key={stat.id}
                style={{
                  flex: 1,
                  paddingRight: index < stats.length - 1 ? "1.5rem" : 0,
                  borderRight: index < stats.length - 1 ? "0.5px solid var(--bg-elevated)" : "none",
                  marginRight: index < stats.length - 1 ? "1.5rem" : 0,
                }}
              >
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-mono), monospace",
                    letterSpacing: "-0.5px",
                  }}
                >
                  {stat.number}
                </div>
                <div
                  style={{
                    fontSize: "9.5px",
                    color: "var(--text-dim)",
                    marginTop: "3px",
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                    fontFamily: "var(--font-mono), monospace",
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section
        className="animate-fade-up delay-6"
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "0 2rem 2rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
            marginBottom: "1rem",
          }}
        >
          {personas.map((persona) => (
            <button
              key={persona.id}
              type="button"
              onClick={() => {
                setActivePersona(persona.id);
              }}
              style={{
                fontSize: "11px",
                fontFamily: "var(--font-mono), monospace",
                padding: "4px 13px",
                borderRadius: "20px",
                border: "0.5px solid var(--border)",
                color: activePersona === persona.id ? "var(--accent-blue)" : "var(--text-dim)",
                background: activePersona === persona.id ? "rgba(88,166,255,0.1)" : "transparent",
                borderColor: activePersona === persona.id ? "rgba(88,166,255,0.4)" : "var(--border)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {persona.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activePersona}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
              gap: "8px",
            }}
          >
            {filteredItems.map((item, index) => {
              const badge = typeBadge(item.type);

              return (
                <motion.div
                  key={`${activePersona}-${item.type}-${item.id}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.3, delay: index * 0.06 }}
                >
                  <Link href={item.url} style={{ textDecoration: "none" }}>
                    <div
                      style={{
                        background: "var(--bg-surface)",
                        border: "0.5px solid var(--bg-elevated)",
                        borderRadius: "8px",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                        cursor: "pointer",
                        transition: "background 0.15s ease, border-color 0.15s ease, transform 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--bg-elevated)";
                        e.currentTarget.style.borderColor = "var(--border)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "var(--bg-surface)";
                        e.currentTarget.style.borderColor = "var(--bg-elevated)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          height: "100px",
                          background: "var(--bg-elevated)",
                          position: "relative",
                          overflow: "hidden",
                          flexShrink: 0,
                        }}
                      >
                        {item.thumbnail_url ? (
                          <Image src={item.thumbnail_url} alt={item.title} fill style={{ objectFit: "cover" }} />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              backgroundImage:
                                "repeating-linear-gradient(45deg,var(--border) 0,var(--border) 1px,transparent 0,transparent 50%)",
                              backgroundSize: "8px 8px",
                              opacity: 0.4,
                            }}
                          />
                        )}

                        <div
                          style={{
                            position: "absolute",
                            top: "7px",
                            left: "7px",
                            fontSize: "9px",
                            fontFamily: "var(--font-mono), monospace",
                            padding: "2px 7px",
                            borderRadius: "4px",
                            backdropFilter: "blur(4px)",
                            color: badge.color,
                            background: badge.background,
                          }}
                        >
                          {badge.label}
                        </div>
                      </div>

                      <div style={{ padding: "0.85rem", display: "flex", flexDirection: "column", flex: 1 }}>
                        <div
                          style={{
                            fontSize: "12.5px",
                            fontWeight: 500,
                            color: "var(--text-primary)",
                            lineHeight: 1.3,
                            marginBottom: "5px",
                          }}
                        >
                          {item.title}
                        </div>

                        <div
                          style={{
                            fontSize: "11px",
                            color: "var(--text-dim)",
                            lineHeight: 1.5,
                            flex: 1,
                            marginBottom: "8px",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {item.description}
                        </div>

                        {item.type === "study" && typeof item.progress === "number" ? (
                          <div
                            style={{
                              height: "2px",
                              background: "var(--bg-elevated)",
                              borderRadius: "1px",
                              marginBottom: "8px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                background: "var(--accent-blue)",
                                borderRadius: "1px",
                                width: `${Math.max(0, Math.min(100, item.progress))}%`,
                                transition: "width 0.6s ease",
                              }}
                            />
                          </div>
                        ) : null}

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "9.5px",
                              fontFamily: "var(--font-mono), monospace",
                              color: "var(--text-faint)",
                            }}
                          >
                            {item.meta}
                          </span>
                          <span
                            style={{
                              fontSize: "9.5px",
                              fontFamily: "var(--font-mono), monospace",
                              color: "var(--text-faint)",
                            }}
                          >
                            {item.date}
                          </span>
                        </div>

                        {item.tags.length > 0 ? (
                          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "7px" }}>
                            {item.tags.slice(0, 3).map((tag) => (
                              <span
                                key={`${item.id}-${tag}`}
                                style={{
                                  fontSize: "9px",
                                  fontFamily: "var(--font-mono), monospace",
                                  color: "var(--text-faint)",
                                  background: "var(--bg-base)",
                                  border: "0.5px solid var(--bg-elevated)",
                                  padding: "1px 6px",
                                  borderRadius: "3px",
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </section>

      <section
        className="animate-fade-in delay-7"
        style={{
          borderTop: "0.5px solid var(--bg-elevated)",
          maxWidth: "900px",
          margin: "0 auto",
          padding: "2rem",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            fontSize: "10.5px",
            textTransform: "uppercase",
            letterSpacing: "1.2px",
            color: "var(--text-dim)",
            fontFamily: "var(--font-mono), monospace",
            marginBottom: "0.9rem",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "var(--accent-green)",
              animation: "pulse-dot 2s ease-in-out infinite",
            }}
          />
          recent activity
        </div>

        <div>
          {liveItems.map((item, index) => (
            <motion.div
              key={`${item.type}-${item.title}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.06 }}
              style={{
                display: "grid",
                gridTemplateColumns: "82px 1fr auto",
                gap: "12px",
                padding: "6px 0",
                borderBottom: index < liveItems.length - 1 ? "0.5px solid var(--bg-elevated)" : "none",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "9px",
                  color: "var(--text-dim)",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                  fontFamily: "var(--font-mono), monospace",
                }}
              >
                <span
                  style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    background: statusDotColor(item.type),
                  }}
                />
                {item.type.replace("_", " ")}
              </div>

              <Link
                href={item.url}
                style={{
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  textDecoration: "none",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.title}
              </Link>

              <div
                style={{
                  fontSize: "9.5px",
                  color: "var(--text-faint)",
                  fontFamily: "var(--font-mono), monospace",
                }}
              >
                {item.date}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section
        className="home-about-strip"
        style={{
          borderTop: "0.5px solid var(--bg-elevated)",
          maxWidth: "900px",
          margin: "0 auto",
          padding: "2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <div>
          <div style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 500, marginBottom: "5px" }}>
            {homepageSettings.about_preview_title}
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-dim)", maxWidth: "380px", lineHeight: 1.6 }}>
            {homepageSettings.about_preview_text || profile.bio}
          </div>
        </div>

        <Link
          href={homepageSettings.about_preview_url || aboutLink}
          style={{
            fontSize: "11.5px",
            fontFamily: "var(--font-mono), monospace",
            color: "var(--accent-blue)",
            textDecoration: "none",
            whiteSpace: "nowrap",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          {homepageSettings.about_preview_button_text}
          <ArrowRight size={12} />
        </Link>
      </section>

      {expertiseItems.length > 0 ? (
        <section
          style={{
            borderTop: "0.5px solid var(--bg-elevated)",
            maxWidth: "900px",
            margin: "0 auto",
            padding: "2rem",
          }}
        >
          <div style={{ fontSize: "22px", color: "var(--text-primary)", marginBottom: "1rem", letterSpacing: "-0.5px" }}>
            Areas of Expertise
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "10px",
            }}
          >
            {expertiseItems.map((item, index) => {
              const Icon = resolveExpertiseIcon(item.icon);

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  style={{
                    border: "0.5px solid var(--bg-elevated)",
                    borderRadius: "10px",
                    background: "var(--bg-surface)",
                    padding: "0.95rem",
                  }}
                >
                  <Icon size={18} color="var(--accent-blue)" strokeWidth={1.75} />
                  <div style={{ marginTop: "0.45rem", fontSize: "13px", color: "var(--text-primary)", fontWeight: 500 }}>
                    {item.title}
                  </div>
                  <div style={{ marginTop: "0.35rem", fontSize: "11px", color: "var(--text-dim)", lineHeight: 1.6 }}>
                    {item.description}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section
        style={{
          borderTop: "0.5px solid var(--bg-elevated)",
          maxWidth: "900px",
          margin: "0 auto",
          padding: "1.4rem 2rem 2.3rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontSize: "11px", color: "var(--text-dim)", fontFamily: "var(--font-mono), monospace" }}>
            Build log: <span style={{ color: "var(--accent-blue)" }}>secure systems</span> · practical research · clean engineering
          </div>

          {finalSocialLinks.length > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              {finalSocialLinks.map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: "10.5px",
                    color: "var(--text-muted)",
                    border: "0.5px solid var(--border)",
                    borderRadius: "20px",
                    padding: "4px 10px",
                    textDecoration: "none",
                    fontFamily: "var(--font-mono), monospace",
                    transition: "color 0.15s ease, border-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--text-primary)";
                    e.currentTarget.style.borderColor = "var(--accent-blue)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--text-muted)";
                    e.currentTarget.style.borderColor = "var(--border)";
                  }}
                >
                  {item.label.toLowerCase()}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
