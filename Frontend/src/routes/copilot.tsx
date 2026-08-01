import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { copilotSearch } from "@/lib/mockApi";
import { copilotExamples, type Candidate } from "@/lib/mockData";
import { MatchRing } from "@/components/match-score";
import { Sparkles, Send } from "lucide-react";

export const Route = createFileRoute("/copilot")({
  component: Copilot,
});

type Turn =
  | { role: "user"; text: string }
  | { role: "ai"; text: string; results: { candidate: Candidate; reason: string }[] };

function Copilot() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, loading]);

  const run = async (query: string) => {
    if (!query.trim() || loading) return;
    setTurns((t) => [...t, { role: "user", text: query }]);
    setInput("");
    setLoading(true);
    const results = await copilotSearch(query);
    setTurns((t) => [
      ...t,
      { role: "ai", text: `Found ${results.length} candidate${results.length === 1 ? "" : "s"} matching your query.`, results },
    ]);
    setLoading(false);
  };

  return (
    <AppShell title="Co-pilot" subtitle="Search your talent pool in natural language">
      <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-10rem)]">
        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
          {turns.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="h-14 w-14 rounded-2xl bg-primary-soft grid place-items-center mx-auto">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <h2 className="mt-5 text-2xl font-bold tracking-tight">Ask about anyone.</h2>
              <p className="mt-2 text-muted-foreground max-w-lg mx-auto">
                Type a query in plain English. Try one of these to get started:
              </p>
              <div className="mt-6 flex flex-col items-center gap-2 max-w-xl mx-auto">
                {copilotExamples.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => run(ex)}
                    className="w-full text-left px-4 py-3 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-muted/40 transition-colors text-sm"
                  >
                    <span className="text-primary mr-2">›</span>{ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-6 py-4">
            {turns.map((t, i) =>
              t.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-md bg-primary text-primary-foreground text-sm">{t.text}</div>
                </div>
              ) : (
                <div key={i} className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-primary" /> {t.text}
                  </div>
                  <div className="grid gap-2 stagger-children">
                    {t.results.map(({ candidate, reason }) => (
                      <Link
                        key={candidate.id}
                        to="/candidates/$id"
                        params={{ id: candidate.id }}
                        className="flex items-center gap-4 p-4 rounded-xl glass-card card-lift"
                      >
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 grid place-items-center text-xs font-semibold text-primary shrink-0">
                          {candidate.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{candidate.name} <span className="text-muted-foreground font-normal">· {candidate.role}</span></div>
                          <div className="text-xs text-primary mt-0.5 truncate">{reason}</div>
                        </div>
                        <MatchRing score={candidate.matchScore} size={40} />
                      </Link>
                    ))}
                  </div>
                </div>
              ),
            )}
            {loading && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" /> Searching your talent pool…
                </div>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
                    <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-40 bg-muted rounded animate-pulse" />
                      <div className="h-2.5 w-56 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 focus-within:border-primary/50 transition-colors">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); run(input); } }}
              rows={1}
              placeholder="Ask co-pilot anything… e.g. 'senior React engineers based in EU'"
              className="flex-1 resize-none bg-transparent outline-none px-3 py-2 text-sm max-h-32"
            />
            <button
              onClick={() => run(input)}
              disabled={!input.trim() || loading}
              className="h-9 w-9 grid place-items-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
