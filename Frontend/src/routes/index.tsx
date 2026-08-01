import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MessageSquare, Sparkles, ShieldCheck, LineChart, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "@/lib/theme";
import { Moon, Sun } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

const chatDemo = [
  { role: "ai", text: "Hi Priya, thanks for applying to Senior Backend Engineer. I'll ask a few quick questions — takes about 5 minutes." },
  { role: "candidate", text: "Sounds good, ready when you are." },
  { role: "ai", text: "Tell me about a system you designed for scale — what tradeoffs did you make?" },
  { role: "candidate", text: "We built an event pipeline handling 40k events/sec on Kafka. Chose replay guarantees over cost." },
  { role: "ai", text: "Nice. How comfortable are you with Kubernetes in production?" },
];

function Landing() {
  const { theme, toggle } = useTheme();
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setVisible((v) => (v < chatDemo.length ? v + 1 : v)), 700);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary/60 grid place-items-center">
              <div className="h-2 w-2 rounded-sm bg-primary-foreground" />
            </div>
            <span className="font-semibold tracking-tight">Avenza</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <Link to="/screening" className="hover:text-foreground transition-colors">Candidate demo</Link>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="h-9 w-9 grid place-items-center rounded-lg hover:bg-muted transition-colors" aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link to="/dashboard" className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
              Try demo <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-soft text-primary px-3 py-1 text-xs font-medium mb-6">
            <Sparkles className="h-3 w-3" /> Intercom meets ChatGPT, for hiring
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]">
            Hiring, but it feels like a conversation.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-lg">
            Avenza screens candidates conversationally and gives recruiters an AI co-pilot over their
            entire talent pool. No more forms, no more spreadsheets — just answers.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/dashboard" className="inline-flex items-center gap-2 h-11 px-6 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">
              Try the recruiter demo <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/screening" className="inline-flex items-center gap-2 h-11 px-6 rounded-lg border border-border bg-card hover:bg-muted transition-colors font-medium">
              See candidate flow
            </Link>
          </div>
          <div className="mt-10 flex items-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[color:var(--success)]" /> Bias-aware screening</div>
            <div className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[color:var(--success)]" /> Explainable scoring</div>
            <div className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[color:var(--success)]" /> Zero setup</div>
          </div>
        </div>

        {/* Chat mockup */}
        <div className="relative">
          <div className="absolute -inset-8 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent blur-3xl -z-10" />
          <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-elevated)] overflow-hidden">
            <div className="flex items-center gap-2 px-4 h-11 border-b border-border bg-muted/40">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
                <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
                <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
              </div>
              <div className="ml-3 text-xs text-muted-foreground">Screening · Senior Backend Engineer</div>
              <div className="ml-auto text-[10px] text-muted-foreground">Q 3 of ~8</div>
            </div>
            <div className="p-5 space-y-3 h-[380px] overflow-hidden">
              {chatDemo.slice(0, visible).map((m, i) => (
                <div key={i} className={`flex ${m.role === "candidate" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
                  <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    m.role === "candidate" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"
                  }`}>{m.text}</div>
                </div>
              ))}
              {visible === chatDemo.length && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground typing-dot" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground typing-dot" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground typing-dot" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="max-w-6xl mx-auto px-6 py-20 border-t border-border/60">
        <div className="max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">How it works</h2>
          <p className="mt-3 text-muted-foreground">Three steps from application to interview-ready.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {[
            { n: "01", title: "Candidate chats", desc: "Applicants complete a natural, conversational screening in minutes — no forms, no dropoff." },
            { n: "02", title: "AI screens & scores", desc: "Avenza maps their answers against role requirements and produces an explainable match score." },
            { n: "03", title: "Recruiter reviews", desc: "Your team uses a co-pilot to search, compare, and shortlist candidates in natural language." },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl border border-border bg-card p-6 hover:border-primary/40 hover:shadow-[var(--shadow-elevated)] transition-all">
              <div className="text-xs font-mono text-primary">{s.n}</div>
              <div className="mt-3 font-semibold text-lg">{s.title}</div>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20 border-t border-border/60">
        <div className="max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Built for how recruiting actually works</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4 mt-12">
          {[
            { icon: MessageSquare, title: "Conversational screening", desc: "A friendly AI interviewer that adapts questions to the role and the answers." },
            { icon: LineChart, title: "Explainable match scoring", desc: "Every score comes with evidence — see exactly which requirements were met and which weren't." },
            { icon: Sparkles, title: "Recruiter co-pilot", desc: "Search your talent pool in plain English. \"Kafka + <30 days notice\" just works." },
            { icon: ShieldCheck, title: "Bias-aware screening", desc: "Toggle a redacted view that hides identity signals so decisions rest on evidence." },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-6 flex gap-4 hover:border-primary/40 transition-colors">
                <div className="h-10 w-10 rounded-lg bg-primary-soft grid place-items-center shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">{f.title}</div>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-border/60">
        <div className="rounded-3xl bg-gradient-to-br from-primary to-primary/70 p-10 md:p-14 text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),_transparent_60%)]" />
          <div className="relative max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Ready to see it in action?</h2>
            <p className="mt-3 text-primary-foreground/80">
              Explore the recruiter dashboard with a fully populated pipeline, or step into a candidate's shoes.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/dashboard" className="inline-flex items-center gap-2 h-11 px-6 rounded-lg bg-background text-foreground font-medium hover:bg-background/90 transition-colors">
                Open recruiter demo <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/screening" className="inline-flex items-center gap-2 h-11 px-6 rounded-lg border border-primary-foreground/30 hover:bg-primary-foreground/10 transition-colors font-medium">
                Try screening chat
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8 mt-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-xs text-muted-foreground">
          <div>© 2026 Avenza. A demo recruiting platform.</div>
          <div className="flex gap-6"><a href="#" className="hover:text-foreground">Privacy</a><a href="#" className="hover:text-foreground">Terms</a></div>
        </div>
      </footer>
    </div>
  );
}
