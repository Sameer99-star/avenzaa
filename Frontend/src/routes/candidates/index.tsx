import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { listCandidates } from "@/lib/mockApi";
import { MatchRing } from "@/components/match-score";
import { Search } from "lucide-react";

export const Route = createFileRoute("/candidates/")({
  component: CandidatesPage,
});

const stages = ["all", "applied", "screened", "shortlisted", "hired"] as const;

function CandidatesPage() {
  const { data, isLoading } = useQuery({ queryKey: ["candidates"], queryFn: () => listCandidates() });
  const [stage, setStage] = useState<(typeof stages)[number]>("all");
  const [q, setQ] = useState("");

  const filtered = data?.filter((c) =>
    (stage === "all" || c.stage === stage) &&
    (c.name.toLowerCase().includes(q.toLowerCase()) || c.role.toLowerCase().includes(q.toLowerCase())),
  ) ?? [];

  return (
    <AppShell title="Candidates" subtitle="Everyone in your talent pool">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2 px-3 h-10 rounded-lg bg-muted flex-1 max-w-md min-w-[200px]">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or role…" className="bg-transparent outline-none text-sm flex-1" />
        </div>
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {stages.map((s) => (
            <button
              key={s}
              onClick={() => setStage(s)}
              className={`px-3 h-8 rounded-md text-xs font-medium capitalize transition-colors ${stage === s ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_100px_80px] md:grid-cols-[2fr_1.5fr_1fr_120px_80px] gap-4 px-5 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <div>Candidate</div>
          <div>Role</div>
          <div className="hidden md:block">Company</div>
          <div>Stage</div>
          <div className="text-right">Match</div>
        </div>
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-5 py-4 border-b border-border last:border-0">
              <div className="h-4 w-40 bg-muted rounded animate-pulse" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="font-semibold">No candidates match those filters</div>
            <p className="mt-1 text-sm text-muted-foreground">Try clearing the search or picking a different stage.</p>
          </div>
        ) : (
          filtered.map((c) => (
            <Link
              key={c.id}
              to="/candidates/$id"
              params={{ id: c.id }}
              className="grid grid-cols-[1fr_1fr_100px_80px] md:grid-cols-[2fr_1.5fr_1fr_120px_80px] gap-4 px-5 py-3.5 border-b border-border last:border-0 items-center hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 grid place-items-center text-xs font-semibold text-primary shrink-0">
                  {c.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="min-w-0">
                  <div className="font-medium truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{c.location}</div>
                </div>
              </div>
              <div className="text-sm truncate">{c.role}</div>
              <div className="hidden md:block text-sm text-muted-foreground truncate">{c.currentCompany}</div>
              <div>
                <span
                  className="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full"
                  style={{
                    color:
                      c.stage === "hired" ? "var(--success)"
                      : c.stage === "shortlisted" ? "var(--accent-warm)"
                      : c.stage === "screened" ? "var(--stage-screened)"
                      : c.stage === "rejected" ? "var(--muted-foreground)"
                      : "var(--primary)",
                    background:
                      c.stage === "hired" ? "color-mix(in oklab, var(--success) 15%, transparent)"
                      : c.stage === "shortlisted" ? "var(--accent-warm-soft)"
                      : c.stage === "screened" ? "color-mix(in oklab, var(--stage-screened) 15%, transparent)"
                      : c.stage === "rejected" ? "var(--muted)"
                      : "var(--primary-soft)",
                  }}
                >{c.stage}</span>
              </div>
              <div className="flex justify-end"><MatchRing score={c.matchScore} size={40} /></div>
            </Link>
          ))
        )}
      </div>
    </AppShell>
  );
}
