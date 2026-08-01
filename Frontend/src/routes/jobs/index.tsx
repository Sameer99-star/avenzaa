import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { listJobs } from "@/lib/mockApi";
import { Plus, Search } from "lucide-react";

export const Route = createFileRoute("/jobs/")({
  component: JobsPage,
});

function JobsPage() {
  const jobs = useQuery({ queryKey: ["jobs"], queryFn: listJobs });
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);

  const filtered = jobs.data?.filter((j) => j.title.toLowerCase().includes(q.toLowerCase()) || j.department.toLowerCase().includes(q.toLowerCase())) ?? [];

  return (
    <AppShell
      title="Jobs"
      subtitle="Open and closed roles"
      actions={
        <button onClick={() => setCreating(true)} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Create job
        </button>
      }
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2 px-3 h-10 rounded-lg bg-muted flex-1 max-w-md">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search roles or departments…" className="bg-transparent outline-none text-sm flex-1" />
        </div>
      </div>

      {jobs.isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 animate-pulse">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="mt-2 h-3 w-24 bg-muted rounded" />
              <div className="mt-4 h-16 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <div className="text-lg font-semibold">No jobs found</div>
          <p className="mt-1 text-sm text-muted-foreground">Try a different search, or create a new role.</p>
          <button onClick={() => setCreating(true)} className="mt-4 inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
            <Plus className="h-4 w-4" /> Create job
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((j) => (
            <Link
              key={j.id}
              to="/jobs/$id"
              params={{ id: j.id }}
              className="rounded-2xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-[var(--shadow-elevated)] transition-all group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">{j.department}</div>
                  <div className="mt-1 font-semibold group-hover:text-primary transition-colors">{j.title}</div>
                </div>
                <span className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full ${
                  j.status === "open" ? "bg-primary-soft text-primary"
                    : j.status === "closed" ? "bg-[color:var(--success)]/15 text-[color:var(--success)]"
                    : "bg-[color:var(--accent-warm-soft)] text-[color:var(--accent-warm)]"
                }`}>{j.status}</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{j.description}</p>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{j.location}</span>
                <span className="font-medium">{j.applicantCount} applicants</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {creating && (
        <div className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm grid place-items-center p-4 animate-in fade-in duration-200" onClick={() => setCreating(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-[var(--shadow-elevated)] p-6 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Create a new job</h3>
            <p className="text-sm text-muted-foreground mt-1">Fields for demo only.</p>
            <div className="mt-5 space-y-3">
              <label className="block">
                <span className="text-xs font-medium">Title</span>
                <input placeholder="e.g. Staff Backend Engineer" className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
              </label>
              <label className="block">
                <span className="text-xs font-medium">Description</span>
                <textarea rows={4} placeholder="What will this role do?" className="mt-1 w-full rounded-lg border border-input bg-background p-3 text-sm outline-none focus:border-primary resize-none" />
              </label>
              <label className="block">
                <span className="text-xs font-medium">Required skills (comma separated)</span>
                <input placeholder="Go, Kafka, Kubernetes" className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setCreating(false)} className="h-9 px-4 rounded-lg border border-border text-sm hover:bg-muted transition-colors">Cancel</button>
              <button onClick={() => setCreating(false)} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">Create job</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
