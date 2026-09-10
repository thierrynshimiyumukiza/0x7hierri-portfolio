"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ExternalLink,
  FileText,
  FolderKanban,
  Globe,
  Home,
  Image as ImageIcon,
  LayoutDashboard,
  Link2,
  Menu,
  Moon,
  Search,
  Sun,
  User,
  X,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: <LayoutDashboard size={14} aria-hidden="true" /> }],
  },
  {
    title: "Content",
    items: [
      { href: "/admin/blog", label: "Blog", icon: <FileText size={14} aria-hidden="true" /> },
      { href: "/admin/projects", label: "Projects", icon: <FolderKanban size={14} aria-hidden="true" /> },
      { href: "/admin/studies/categories", label: "Study tracks", icon: <BookOpen size={14} aria-hidden="true" /> },
      { href: "/admin/studies/entries", label: "Study entries", icon: <BookOpen size={14} aria-hidden="true" /> },
      { href: "/admin/media", label: "Media", icon: <ImageIcon size={14} aria-hidden="true" /> },
    ],
  },
  {
    title: "Site",
    items: [
      { href: "/admin/homepage", label: "Homepage", icon: <Home size={14} aria-hidden="true" /> },
      { href: "/admin/about", label: "About", icon: <User size={14} aria-hidden="true" /> },
      { href: "/admin/profile", label: "Profile", icon: <User size={14} aria-hidden="true" /> },
      { href: "/admin/navigation", label: "Navigation", icon: <Link2 size={14} aria-hidden="true" /> },
      { href: "/admin/social-links", label: "Social links", icon: <Link2 size={14} aria-hidden="true" /> },
      { href: "/admin/footer", label: "Footer", icon: <Globe size={14} aria-hidden="true" /> },
      { href: "/admin/seo", label: "SEO", icon: <Search size={14} aria-hidden="true" /> },
    ],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
  }, []);

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      window.localStorage.setItem("site-theme", next);
    } catch {
      // Persisting the choice is optional.
    }
  }

  return (
    <button type="button" onClick={toggle} className="icon-button" title="Toggle light and dark theme">
      {theme === "light" ? <Moon size={13} aria-hidden="true" /> : <Sun size={13} aria-hidden="true" />}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}

type AdminShellProps = {
  children: ReactNode;
  signOut: () => Promise<void>;
  siteUrl: string;
};

export default function AdminShell({ children, signOut, siteUrl }: AdminShellProps) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!navOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNavOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [navOpen]);

  const current = ALL_ITEMS.find((item) => isActive(pathname, item.href));
  const sectionLabel = current?.label ?? "Admin";

  return (
    <div className="admin-shell">
      <aside className="admin-nav" data-open={navOpen ? "true" : "false"}>
        <div className="admin-nav-brand">
          <span className="admin-nav-mark">0x</span>
          <span>Control room</span>
          <button
            type="button"
            className="icon-button admin-nav-close"
            onClick={() => setNavOpen(false)}
            aria-label="Close navigation"
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>

        <nav className="admin-nav-scroll" aria-label="Admin sections">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="admin-nav-group">
              <p className="admin-nav-group-title">{group.title}</p>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="admin-nav-link"
                  data-active={isActive(pathname, item.href) ? "true" : "false"}
                  aria-current={isActive(pathname, item.href) ? "page" : undefined}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="admin-nav-footer">
          <a href={siteUrl || "/"} target="_blank" rel="noreferrer" className="admin-nav-link">
            <ExternalLink size={14} aria-hidden="true" />
            View site
          </a>
        </div>
      </aside>

      {navOpen ? <div className="admin-nav-scrim" onClick={() => setNavOpen(false)} role="presentation" /> : null}

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="icon-button admin-nav-trigger"
            onClick={() => setNavOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={16} aria-hidden="true" />
          </button>

          <div className="admin-breadcrumb">
            <span>Admin</span>
            <span aria-hidden="true">/</span>
            <strong>{sectionLabel}</strong>
          </div>

          <div className="admin-topbar-actions">
            <ThemeToggle />
            <form action={signOut}>
              <button type="submit" className="admin-button admin-button-ghost">
                Sign out
              </button>
            </form>
          </div>
        </header>

        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
