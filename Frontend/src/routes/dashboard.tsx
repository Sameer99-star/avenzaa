import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { listCandidates, listJobs, getDashboardStats } from "@/lib/mockApi";
import { Briefcase, Users, Clock, TrendingUp, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const jobs = useQuery({ queryKey: ["jobs"], queryFn: listJobs });
  const cands = useQuery({ queryKey: ["candidates"], queryFn: () => listCandidates() });
  const stats = useQuery({ queryKey: ["dashboardStats"], queryFn: getDashboardStats });

  const openRoles = jobs.data?.filter((j) => j.status === "open").length ?? 0;
  const active = cands.data?.length ?? 0;
  const funnel = stats.data?.funnel ?? [];
  const recentActivity = stats.data?.recentActivity ?? [];
  const maxFunnel = Math.max(...funnel.map((f) => f.value), 1);

  return (
    <AppShell title="Dashboard" subtitle="Your hiring pipeline at a glance">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "Open roles", value: openRoles, hint: "+2 this month", icon: Briefcase, emphasis: false },
          { label: "Active candidates", value: active, hint: "+8 this week", icon: Users, emphasis: true },
          { label: "Avg time-to-screen", value: "6.2h", hint: "-1.4h vs last mo", icon: Clock, emphasis: false },
          { label: "Shortlist rate", value: "21%", hint: "+3pp", icon: TrendingUp, emphasis: false },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className={
                s.emphasis
                  ? "relative rounded-2xl glass-card focal-glow bg-gradient-to-br from-primary-soft/40 via-card to-card p-5 overflow-hidden"
                  : "relative rounded-2xl glass-card card-lift p-5"
              }
            >
              {s.emphasis && (
                <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/25 blur-3xl" />
              )}
              <div className="relative flex items-center justify-between">
                <div className={`text-[11px] uppercase tracking-[0.14em] font-medium ${s.emphasis ? "text-primary/90" : "text-muted-foreground"}`}>{s.label}</div>
                <Icon className={`h-4 w-4 ${s.emphasis ? "text-primary" : "text-muted-foreground/60"}`} />
              </div>
              <div className={`relative mt-3 text-[32px] leading-none font-semibold tracking-[-0.03em] tabular ${s.emphasis ? "text-primary" : "text-[color:var(--heading)]"}`}>{s.value}</div>
              <div className="relative mt-2 text-xs text-[color:var(--success)] flex items-center gap-1 tabular"><ArrowUpRight className="h-3 w-3" />{s.hint}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl glass-card p-7">

          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-lg">Pipeline funnel</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Across all open roles this quarter</p>

            </div>
          </div>
          <div className="space-y-4">
            {funnel.map((f, i) => {
              const stageColors = [
                "var(--stage-applied)",
                "var(--stage-screened)",
                "var(--stage-shortlisted)",
                "var(--stage-hired)",
              ];
              const color = stageColors[i] ?? "var(--primary)";
              return (
                <div key={f.stage}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium">{f.stage}</span>
                    <span className="text-muted-foreground tabular">{f.value}</span>
                  </div>
                  <div className="h-8 rounded-lg bg-muted/60 overflow-hidden">
                    <div
                      className="h-full rounded-lg transition-all duration-700"
                      style={{
                        width: `${(f.value / maxFunnel) * 100}%`,
                        background: `linear-gradient(90deg, color-mix(in oklab, ${color} 90%, transparent), ${color})`,
                        boxShadow: `0 0 24px -6px color-mix(in oklab, ${color} 55%, transparent)`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl glass-card p-7">
          <h2 className="font-semibold text-lg">Recent activity</h2>
          <div className="mt-4 space-y-4">
            {recentActivity.map((a) => (
              <div key={a.id} className="flex gap-3 text-sm">
                <div className="h-2 w-2 mt-1.5 rounded-full bg-[color:var(--accent-warm)] shrink-0" />
                <div className="flex-1">
                  <div className="leading-snug">{a.text}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl glass-card p-7">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-lg">Roles needing attention</h2>
          <Link to="/jobs" className="text-xs text-primary hover:underline">View all</Link>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {jobs.data?.filter((j) => j.status === "open").slice(0, 4).map((j) => (
            <Link key={j.id} to="/jobs/$id" params={{ id: j.id }} className="rounded-xl border border-border/70 p-4 card-lift hover:border-primary/40 bg-card/40">

              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{j.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{j.department} · {j.location}</div>
                </div>
                <div className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium tabular">{j.applicantCount}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}