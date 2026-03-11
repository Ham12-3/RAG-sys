"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Upload,
  BarChart3,
  Activity,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: "Query", href: "/", icon: Search },
  { label: "Ingestion", href: "/ingestion", icon: Upload },
  { label: "Evaluation", href: "/evaluation", icon: BarChart3 },
  { label: "Monitoring", href: "/monitoring", icon: Activity },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const pathname = usePathname();

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col glass-card border-r border-border-glow",
        "transition-[width] duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo / App Title */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-white font-bold text-sm">
          R
        </div>
        <span
          className={cn(
            "text-lg font-semibold text-text-primary whitespace-nowrap transition-opacity duration-200",
            collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
          )}
        >
          RAG System
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 px-2 py-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-text-secondary hover:bg-card-hover hover:text-text-primary"
              )}
            >
              {/* Active indicator — left glow bar */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-accent shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
              )}

              <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-accent")} />

              <span
                className={cn(
                  "whitespace-nowrap transition-opacity duration-200",
                  collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="flex flex-col gap-2 border-t border-border px-2 py-3">
        {/* System status */}
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full bg-status-green animate-pulse-dot" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-status-green" />
          </span>
          <span
            className={cn(
              "text-xs text-text-muted whitespace-nowrap transition-opacity duration-200",
              collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
            )}
          >
            All Systems
          </span>
        </div>

        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-text-secondary hover:bg-card-hover hover:text-text-primary transition-colors duration-150"
          aria-label="Toggle dark mode"
        >
          {darkMode ? (
            <Sun className="h-5 w-5 shrink-0" />
          ) : (
            <Moon className="h-5 w-5 shrink-0" />
          )}
          <span
            className={cn(
              "text-sm whitespace-nowrap transition-opacity duration-200",
              collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
            )}
          >
            {darkMode ? "Light Mode" : "Dark Mode"}
          </span>
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-text-secondary hover:bg-card-hover hover:text-text-primary transition-colors duration-150"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5 shrink-0" />
          ) : (
            <ChevronLeft className="h-5 w-5 shrink-0" />
          )}
          <span
            className={cn(
              "text-sm whitespace-nowrap transition-opacity duration-200",
              collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
            )}
          >
            Collapse
          </span>
        </button>
      </div>
    </aside>
  );
}
