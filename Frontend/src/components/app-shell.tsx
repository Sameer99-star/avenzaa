import { Link, useLocation } from "@tanstack/react-router";
import { type ReactNode } from "react";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Sparkles,
  BarChart3,
  Settings,
  Moon,
  Sun,
  Search,
} from "lucide-react";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/jobs", label: "Jobs", icon: Briefcase },
  { to: "/candidates", label: "Candidates", icon: Users },
  { to: "/copilot", label: "Co-pilot", icon: Sparkles },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children, title, subtitle, actions }: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  const { theme, toggle } = useTheme();
  const location = useLocation();

  return (
    <div className="min-h-screen text-foreground flex">
      <aside className="hidden md:flex w-60 flex-col bg-sidebar sidebar-edge shrink-0">
        <Link to="/" className="flex items-center gap-2.5 px-5 h-16 border-b border-sidebar-border">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary/50 grid place-items-center shadow-[0_4px_16px_-6px_color-mix(in_oklab,var(--primary)_60%,transparent)]">
            <div className="h-2 w-2 rounded-[2px] bg-primary-foreground rotate-45" />
          </div>
          <span className="font-semibold tracking-[-0.02em] text-sidebar-foreground">Avenza</span>
        </Link>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((item) => {
            const active = location.pathname === item.to || location.pathname.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                  active
                    ? "bg-sidebar-accent text-primary font-medium shadow-[inset_0_1px_0_0_color-mix(in_oklab,white_8%,transparent),0_1px_2px_oklch(0_0_0/0.2)]"
                    : "text-sidebar-foreground/55 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground",
                )}
              >
                {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-primary" />}
                <Icon className={cn("h-4 w-4 transition-colors", active ? "text-primary" : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/80")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/50 grid place-items-center text-primary-foreground text-xs font-semibold">AV</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-sidebar-foreground truncate">Ava Vega</div>
              <div className="text-xs text-muted-foreground truncate">Head of Talent</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 border-b border-border flex items-center justify-between px-8 gap-4 bg-background/60 backdrop-blur-xl sticky top-0 z-10">
          <div className="min-w-0">
            <h1 className="text-[19px] font-semibold tracking-[-0.025em] truncate">{title}</h1>
            {subtitle && <p className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-2 px-3 h-9 rounded-lg bg-muted/60 border border-border/60 text-muted-foreground w-72 hover:border-border-strong transition-colors">
              <Search className="h-4 w-4" />
              <span className="text-sm">Search candidates, jobs…</span>
              <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-background/60 border border-border tabular">⌘K</kbd>
            </div>
            {actions}
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="h-9 w-9 grid place-items-center rounded-lg hover:bg-muted transition-colors"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>
        <div className="flex-1 px-8 py-10">{children}</div>
      </main>
    </div>
  );
}
