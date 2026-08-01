import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { getCandidate } from "@/lib/mockApi";
import { MatchRing, ScoreBar } from "@/components/match-score";
import { ArrowLeft, Check, Flag, ChevronDown, EyeOff, Eye, MapPin, Building2, Clock } from "lucide-react";

export const Route = createFileRoute("/candidates/$id")({
  component: CandidateProfile,
});

function CandidateProfile() {
  const { id } = useParams({ from: "/candidates/$id" });
  const { data: c, isLoading } = useQuery({ queryKey: ["candidate", id], queryFn: () => getCandidate(id) });
  const [redacted, setRedacted] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(true);

  if (isLoading) return <AppShell title="Loading…"><div className="h-40 rounded-2xl bg-muted animate-pulse" /></AppShell>;
  if (!c) return <AppShell title="Candidate not found"><Link to="/candidates" className="text-primary text-sm">← Back</Link></AppShell>;

  const displayName = redacted ? c.anonId : c.name;
  const initials = redacted ? "??" : c.name.split(" ").map((n) => n[0]).join("");

  return (
    <AppShell title={displayName} subtitle={`Applied for ${c.role}`}>
      <Link to="/candidates" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to candidates
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Summary card */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-start gap-5">
              <div className={`h-16 w-16 rounded-full grid place-items-center text-lg font-semibold shrink-0 transition-all ${
                redacted ? "bg-muted text-muted-foreground blur-[2px]" : "bg-gradient-to-br from-primary/40 to-primary/10 text-primary"
              }`}>
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-xl font-semibold ${redacted ? "font-mono" : ""}`}>{displayName}</div>
                <div className={`mt-1 text-sm text-muted-foreground ${redacted ? "blur-[3px] select-none" : ""}`}>{c.email}</div>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {redacted ? "—" : c.location}</span>
                  <span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" /> {redacted ? "—" : c.currentCompany}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {c.noticePeriodDays}d notice</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <MatchRing score={c.matchScore} size={76} />
                <div className="text-xs text-muted-foreground">Match score</div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-border flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="text-sm font-medium">Bias-aware screening</div>
                <div className="text-xs text-muted-foreground mt-0.5">Hide identity signals to review evidence only.</div>
              </div>
              <button
                onClick={() => setRedacted((r) => !r)}
                className={`inline-flex items-center gap-2 h-9 px-4 rounded-lg border text-sm font-medium transition-colors ${
                  redacted ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
                }`}
              >
                {redacted ? <><EyeOff className="h-4 w-4" /> Redacted view on</> : <><Eye className="h-4 w-4" /> View redacted profile</>}
              </button>
            </div>
          </div>

          {/* Why this score */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold">Why this score</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Evidence mapped against role requirements.</p>
              </div>
              <div className="hidden sm:block w-40"><ScoreBar score={c.matchScore} /></div>
            </div>
            <div className="space-y-3">
              {c.breakdown.map((b, i) => (
                <div key={i} className="grid md:grid-cols-[1fr_1.4fr] gap-3 p-4 rounded-xl border border-border bg-background/40">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Required</div>
                    <div className="mt-1 text-sm">{b.requirement}</div>
                  </div>
                  <div className="flex gap-3">
                    <div className={`h-6 w-6 rounded-full grid place-items-center shrink-0 ${
                      b.match === "met" ? "bg-[color:var(--success)]/15 text-[color:var(--success)]"
                      : b.match === "partial" ? "bg-[color:var(--warning)]/15 text-[color:var(--warning)]"
                      : "bg-muted text-muted-foreground"
                    }`}>
                      {b.match === "met" ? <Check className="h-3.5 w-3.5" /> : <Flag className="h-3.5 w-3.5" />}
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {b.match === "met" ? "Found" : b.match === "partial" ? "Partial match" : "Gap"}
                      </div>
                      <div className="mt-1 text-sm leading-relaxed">{b.evidence}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transcript */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <button
              onClick={() => setTranscriptOpen((o) => !o)}
              className="w-full flex items-center justify-between p-6 hover:bg-muted/30 transition-colors"
            >
              <div className="text-left">
                <h3 className="font-semibold">Screening transcript</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{c.transcript.length} messages</p>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${transcriptOpen ? "rotate-180" : ""}`} />
            </button>
            {transcriptOpen && (
              <div className="px-6 pb-6 space-y-3 max-h-[500px] overflow-y-auto scrollbar-thin">
                {c.transcript.map((t, i) => (
                  <div key={i} className={`flex ${t.role === "candidate" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      t.role === "candidate" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted rounded-bl-md"
                    }`}>{t.role === "candidate" && redacted ? "[Response hidden — bias-aware view]" : t.text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</div>
            <div className="mt-3 space-y-2">
              <button className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">Move to shortlist</button>
              <button className="w-full h-10 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">Schedule interview</button>
              <button className="w-full h-10 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">Reject with feedback</button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Skills</div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {c.skills.map((s) => (
                <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-primary-soft text-primary font-medium">{s}</span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">At a glance</div>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Experience</dt><dd>{c.yearsExperience} years</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Applied</dt><dd>{c.appliedAt}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Notice</dt><dd>{c.noticePeriodDays} days</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Stage</dt><dd className="capitalize">{c.stage}</dd></div>
            </dl>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
