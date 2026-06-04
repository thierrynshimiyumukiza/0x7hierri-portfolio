"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/homepage", label: "Homepage" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/studies", label: "Studies" },
  { href: "/admin/studies/categories", label: "Categories" },
  { href: "/admin/studies/entries", label: "Entries" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/navigation", label: "Navigation" },
  { href: "/admin/social-links", label: "Social Links" },
  { href: "/admin/profile", label: "Profile" },
  { href: "/admin/about", label: "About" },
  { href: "/admin/footer", label: "Footer" },
  { href: "/admin/seo", label: "SEO" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="admin-sidebar"
      style={{
        background: "var(--bg-base)",
        borderRight: "0.5px solid var(--border-muted)",
      }}
    >
      <nav style={{ display: "flex", flexDirection: "column", padding: "10px 0" }}>
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontSize: "12px",
                color: isActive ? "var(--text-primary)" : "var(--text-dim)",
                fontFamily: "var(--font-mono), monospace",
                padding: "8px 1.5rem",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                textDecoration: "none",
                background: isActive ? "var(--bg-surface)" : "transparent",
                borderLeft: isActive ? "2px solid var(--accent-blue)" : "2px solid transparent",
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
