import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { getJob, listCandidates } from "@/lib/mockApi";
import { MatchRing } from "@/components/match-score";
import { ArrowLeft, MapPin } from "lucide-react";

export const Route = createFileRoute("/jobs/$id")({
  component: JobDetail,
});

function JobDetail() {
  const { id } = useParams({ from: "/jobs/$id" });
  const job = useQuery({ queryKey: ["job", id], queryFn: () => getJob(id) });
  const cands = useQuery({ queryKey: ["candidates", id], queryFn: () => listCandidates({ jobId: id }) });

  if (job.isLoading) {
    return <AppShell title="Loading…"><div className="h-40 rounded-2xl bg-muted animate-pulse" /></AppShell>;
  }
  if (!job.data) {
    return <AppShell title="Job not found"><Link to="/jobs" className="text-primary hover:underline text-sm">← Back to jobs</Link></AppShell>;
  }

  return (
    <AppShell title={job.data.title} subtitle={`${job.data.department} · ${job.data.location}`}>
      <Link to="/jobs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to jobs
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-semibold">{job.data.title}</h2>
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {job.data.location}
                </div>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full uppercase tracking-wider font-medium ${
                job.data.status === "open" ? "bg-primary-soft text-primary"
                  : job.data.status === "closed" ? "bg-[color:var(--success)]/15 text-[color:var(--success)]"
                  : "bg-[color:var(--accent-warm-soft)] text-[color:var(--accent-warm)]"
              }`}>{job.data.status}</span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{job.data.description}</p>

            <div className="mt-6">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Requirements</div>
              <ul className="space-y-1.5 text-sm">
                {job.data.requirements.map((r) => (
                  <li key={r} className="flex gap-2"><span className="text-primary">·</span> {r}</li>
                ))}
              </ul>
            </div>

            <div className="mt-6">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Required skills</div>
              <div className="flex flex-wrap gap-1.5">
                {job.data.skills.map((s) => (
                  <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-primary-soft text-primary font-medium">{s}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card">
            <div className="p-6 border-b border-border">
              <h3 className="font-semibold">Applicants</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Sorted by match score</p>
            </div>
            <div className="divide-y divide-border">
              {cands.isLoading && Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2"><div className="h-3 w-32 bg-muted rounded animate-pulse" /><div className="h-2.5 w-48 bg-muted rounded animate-pulse" /></div>
                </div>
              ))}
              {cands.data?.sort((a, b) => b.matchScore - a.matchScore).map((c) => (
                <Link key={c.id} to="/candidates/$id" params={{ id: c.id }} className="flex items-center gap-4 p-4 hover:bg-muted/40 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 grid place-items-center text-sm font-semibold text-primary">
                    {c.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{c.currentCompany} · {c.yearsExperience}y · {c.location}</div>
                  </div>
                  <div className="hidden sm:flex flex-wrap gap-1 max-w-[200px] justify-end">
                    {c.skills.slice(0, 3).map((s) => <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{s}</span>)}
                  </div>
                  <MatchRing score={c.matchScore} size={44} />
                </Link>
              ))}
              {cands.data?.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground">No candidates yet.</div>}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pipeline</div>
            <div className="mt-4 space-y-3 text-sm">
              {["applied", "screened", "shortlisted", "hired"].map((s) => {
                const count = cands.data?.filter((c) => c.stage === s).length ?? 0;
                return (
                  <div key={s} className="flex items-center justify-between">
                    <span className="capitalize">{s}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
