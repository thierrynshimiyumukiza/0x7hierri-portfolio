"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Moon, Sun, X } from "lucide-react";
import SiteSearch from "@/components/site/SiteSearch";

interface NavItem {
  label: string;
  url: string;
  isExternal?: boolean | null;
}

type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "site-theme";

function resolveTheme(): ThemeMode {
  const rootTheme = document.documentElement.getAttribute("data-theme");
  if (rootTheme === "light" || rootTheme === "dark") return rootTheme;

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "light" || storedTheme === "dark") return storedTheme;

  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export default function Navbar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>("dark");

  const navItems = useMemo(() => {
    if (items.length > 0) return items;

    return [
      { label: "about", url: "/about", isExternal: false },
      { label: "projects", url: "/projects", isExternal: false },
      { label: "blog", url: "/blog", isExternal: false },
      { label: "studies", url: "/studies", isExternal: false },
    ];
  }, [items]);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const resolvedTheme = resolveTheme();
    document.documentElement.setAttribute("data-theme", resolvedTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, resolvedTheme);
    setTheme(resolvedTheme);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const nextTheme: ThemeMode = prev === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", nextTheme);
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      return nextTheme;
    });
  };

  const isActive = (url: string) => (url === "/" ? pathname === "/" : pathname === url || pathname.startsWith(`${url}/`));

  const renderLink = (item: NavItem) =>
    item.isExternal ? (
      <a key={item.url} href={item.url} target="_blank" rel="noreferrer">
        {item.label.toLowerCase()}
      </a>
    ) : (
      <Link key={item.url} href={item.url} aria-current={isActive(item.url) ? "page" : undefined}>
        {item.label.toLowerCase()}
      </Link>
    );

  return (
    <nav className="ui-nav site-navbar" aria-label="Main">
      <div className="ui-wrap ui-nav-inner">
        <Link href="/" className="ui-brand shrink-0">
          <span style={{ color: "var(--text-dim)" }}>~/</span>0x7hierri
          <span className="ui-brand-caret" aria-hidden="true">
            _
          </span>
        </Link>

        <div className="ui-nav-links ui-hide-mobile min-w-0 overflow-x-auto">{navItems.map(renderLink)}</div>

        <div className="flex shrink-0 items-center gap-2">
          <SiteSearch />
          <button
            type="button"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to night mode"}
            className="ui-btn"
            style={{ padding: "0 13px" }}
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
          </button>

          <Link href="/contact" className="ui-btn ui-hide-mobile" style={{ fontSize: 14 }}>
            contact
          </Link>

          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls="mobile-site-menu"
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            className="ui-btn ui-hide-desktop"
            style={{ padding: "0 13px" }}
            onClick={() => setIsOpen((prev) => !prev)}
          >
            {isOpen ? <X size={16} aria-hidden="true" /> : <Menu size={16} aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div
        id="mobile-site-menu"
        className={`ui-mobile-menu ui-hide-desktop ${isOpen ? "block" : "hidden"}`}
        style={{ borderTop: "1px solid var(--border-muted)" }}
      >
        <div className="ui-wrap flex flex-col gap-1 py-3">
          {navItems.map(renderLink)}
          <Link href="/contact" aria-current={isActive("/contact") ? "page" : undefined}>
            contact
          </Link>
        </div>
      </div>
    </nav>
  );
}
