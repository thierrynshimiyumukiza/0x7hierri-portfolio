"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Moon, Sun, X } from "lucide-react";

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

  return (
    <nav
      className="site-navbar sticky top-0 z-50 border-b backdrop-blur"
      style={{ borderColor: "var(--border-muted)", backgroundColor: "var(--bg-base)" }}
    >
      <div className="mx-auto flex w-full max-w-[1040px] items-center justify-between gap-2 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="shrink-0 font-mono text-[13px] font-medium tracking-[-0.02em] sm:text-[14px]"
          style={{ color: "var(--accent-blue)" }}
        >
          <span style={{ color: "var(--text-faint)" }}>~/</span>
          0x7hierri
        </Link>

        <div className="hidden min-w-0 flex-1 items-center justify-center gap-4 overflow-x-auto px-2 md:flex lg:gap-5">
          {navItems.map((item) => {
            const isActive = pathname === item.url;

            if (item.isExternal) {
              return (
                <a
                  key={item.url}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="whitespace-nowrap font-mono text-[12px] tracking-[0.02em] transition-colors"
                  style={{ color: "var(--text-muted)" }}
                >
                  {item.label.toLowerCase()}
                </a>
              );
            }

            return (
              <Link
                key={item.url}
                href={item.url}
                className="whitespace-nowrap font-mono text-[12px] tracking-[0.02em] transition-colors"
                style={{ color: isActive ? "var(--text-primary)" : "var(--text-muted)" }}
              >
                {item.label.toLowerCase()}
              </Link>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to night mode"}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <Link
            href="/contact"
            className="hidden whitespace-nowrap rounded-md border px-3.5 py-1.5 font-mono text-[11.5px] transition-colors md:inline-flex"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          >
            contact me
          </Link>

          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls="mobile-site-menu"
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors md:hidden"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
            onClick={() => setIsOpen((prev) => !prev)}
          >
            {isOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      <div
        id="mobile-site-menu"
        className={`border-t px-4 py-3 sm:px-6 md:hidden ${isOpen ? "block" : "hidden"}`}
        style={{ borderColor: "var(--border-muted)", backgroundColor: "var(--bg-base)" }}
      >
        <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.url;

            if (item.isExternal) {
              return (
                <a
                  key={item.url}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md px-2.5 py-2 font-mono text-[12.5px] tracking-[0.02em] transition-colors"
                  style={{ color: "var(--text-muted)" }}
                >
                  {item.label.toLowerCase()}
                </a>
              );
            }

            return (
              <Link
                key={item.url}
                href={item.url}
                className="rounded-md px-2.5 py-2 font-mono text-[12.5px] tracking-[0.02em] transition-colors"
                style={{ color: isActive ? "var(--text-primary)" : "var(--text-muted)" }}
              >
                {item.label.toLowerCase()}
              </Link>
            );
          })}

          <Link
            href="/contact"
            className="mt-1 rounded-md border px-2.5 py-2 font-mono text-[12px] transition-colors"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          >
            contact me
          </Link>
        </div>
      </div>
    </nav>
  );
}
