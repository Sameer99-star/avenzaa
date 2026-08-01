import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { teamMembers } from "@/lib/mockData";

export const Route = createFileRoute("/settings")({
  component: Settings,
});

function Settings() {
  const [notifs, setNotifs] = useState({ digest: true, mentions: true, marketing: false });
  return (
    <AppShell title="Settings" subtitle="Company, team, and preferences">
      <div className="max-w-3xl space-y-6">
        <Section title="Company profile">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Company name" defaultValue="Avenza Labs" />
            <Field label="Website" defaultValue="avenza.com" />
            <Field label="Support email" defaultValue="hello@avenza.com" />
            <Field label="Time zone" defaultValue="Europe / Berlin" />
          </div>
        </Section>

        <Section title="Team">
          <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
            {teamMembers.map((m) => (
              <div key={m.email} className="flex items-center gap-3 p-4">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 grid place-items-center text-xs font-semibold text-primary">
                  {m.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{m.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{m.email}</div>
                </div>
                <div className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">{m.role}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Notifications">
          <div className="space-y-3">
            {[
              { k: "digest", label: "Daily pipeline digest", desc: "A summary of new applicants and screening completions." },
              { k: "mentions", label: "Mentions & assignments", desc: "When a teammate loops you in." },
              { k: "marketing", label: "Product updates", desc: "Occasional news about new Avenza features." },
            ].map((n) => (
              <div key={n.k} className="flex items-center justify-between gap-4 p-3 rounded-xl border border-border">
                <div>
                  <div className="font-medium text-sm">{n.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{n.desc}</div>
                </div>
                <Toggle on={notifs[n.k as keyof typeof notifs]} onChange={(v) => setNotifs((s) => ({ ...s, [n.k]: v }))} />
              </div>
            ))}
          </div>
        </Section>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <label className="block">
      <span className="text-xs font-medium">{label}</span>
      <input defaultValue={defaultValue} className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary transition-colors" />
    </label>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 rounded-full transition-colors ${on ? "bg-primary" : "bg-muted"}`}
      aria-pressed={on}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-all ${on ? "left-[calc(100%-1.375rem)]" : "left-0.5"}`} />
    </button>
  );
}
