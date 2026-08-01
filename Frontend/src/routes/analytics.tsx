import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { funnelData, skillGapData, timeToHireData } from "@/lib/mockData";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/analytics")({
  component: Analytics,
});

function Analytics() {
  return (
    <AppShell title="Analytics" subtitle="Trends across your pipeline">
      <div className="grid lg:grid-cols-2 gap-6">
        <ChartCard title="Time to hire" subtitle="Median days from application to offer">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={timeToHireData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="tth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.6} />
                  <stop offset="55%" stopColor="var(--primary)" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
                <filter id="tthGlow" x="-20%" y="-40%" width="140%" height="180%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
              <Area type="monotone" dataKey="days" stroke="var(--primary)" strokeWidth={2.5} fill="url(#tth)" filter="url(#tthGlow)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Pipeline funnel" subtitle="Quarter-to-date">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={funnelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="stage" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {funnelData.map((_, i) => {
                  const stageColors = [
                    "var(--stage-applied)",
                    "var(--stage-screened)",
                    "var(--stage-shortlisted)",
                    "var(--stage-hired)",
                  ];
                  return <Cell key={i} fill={stageColors[i] ?? "var(--primary)"} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top skill gaps" subtitle="Across rejected candidates this quarter" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={skillGapData} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="skill" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} width={90} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
              <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                {skillGapData.map((_, i) => (
                  <Cell key={i} fill="var(--accent-warm)" fillOpacity={1 - i * 0.12} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </AppShell>
  );
}

function ChartCard({ title, subtitle, children, className }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border/70 bg-card/70 p-6 ${className ?? ""}`}>
      <div className="mb-4">
        <div className="font-semibold">{title}</div>
        {subtitle && <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}
