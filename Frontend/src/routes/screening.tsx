import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send, Check } from "lucide-react";
import { screeningScript } from "@/lib/mockData";

export const Route = createFileRoute("/screening")({
  component: Screening,
});

type Msg = { role: "ai" | "candidate"; text: string };

function Screening() {
  const [messages, setMessages] = useState<Msg[]>([{ role: "ai", text: screeningScript[0].question }]);
  const [step, setStep] = useState(0);
  const [input, setInput] = useState("");
  const [aiTyping, setAiTyping] = useState(false);
  const [done, setDone] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, aiTyping]);

  const send = () => {
    if (!input.trim() || aiTyping || done) return;
    const answer = input.trim();
    setMessages((m) => [...m, { role: "candidate", text: answer }]);
    setInput("");

    const nextStep = step + 1;
    if (nextStep >= screeningScript.length) {
      setTimeout(() => setDone(true), 800);
      return;
    }
    setAiTyping(true);
    setTimeout(() => {
      setMessages((m) => [...m, { role: "ai", text: screeningScript[nextStep].question }]);
      setStep(nextStep);
      setAiTyping(false);
    }, 1400);
  };

  const progress = Math.min(((step + 1) / screeningScript.length) * 100, 100);

  if (done) {
    return (
      <div className="min-h-screen bg-background grid place-items-center px-6">
        <div className="max-w-md text-center">
          <div className="h-16 w-16 rounded-full bg-[color:var(--success)]/15 grid place-items-center mx-auto">
            <Check className="h-8 w-8 text-[color:var(--success)]" />
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight">You're all set.</h1>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Thanks for taking the time. Our team will review your conversation and get back to you within a few business days.
          </p>
          <Link to="/" className="mt-8 inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">
            Back to Avenza
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary/60" />
            <span className="font-semibold">Avenza</span>
          </Link>
          <div className="text-xs text-muted-foreground">
            Question {Math.min(step + 1, screeningScript.length)} of ~{screeningScript.length}
          </div>
        </div>
        <div className="h-1 bg-muted">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "candidate" ? "justify-end" : "justify-start"} bubble-in`}>
              {m.role === "ai" && (
                <div className="h-8 w-8 rounded-lg shrink-0 mr-3 mt-0.5 grid place-items-center bg-gradient-to-br from-primary to-primary/50 shadow-[0_4px_16px_-6px_color-mix(in_oklab,var(--primary)_55%,transparent)]">
                  <div className="h-2.5 w-2.5 rounded-[2px] bg-primary-foreground rotate-45" />
                </div>
              )}
              <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-[15px] leading-relaxed shadow-[0_2px_10px_-4px_oklch(0_0_0/0.25)] ${
                m.role === "candidate"
                  ? "bg-gradient-to-br from-primary to-primary/85 text-primary-foreground rounded-br-md"
                  : "bg-card border border-border/70 text-foreground rounded-bl-md"
              }`}>{m.text}</div>
            </div>
          ))}
          {aiTyping && (
            <div className="flex justify-start bubble-in">
              <div className="h-8 w-8 rounded-lg shrink-0 mr-3 mt-0.5 grid place-items-center bg-gradient-to-br from-primary to-primary/50">
                <div className="h-2.5 w-2.5 rounded-[2px] bg-primary-foreground rotate-45" />
              </div>
              <div className="bg-card border border-border/70 rounded-2xl rounded-bl-md px-4 py-3.5 flex gap-1.5 items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/70 typing-dot" style={{ animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-primary/70 typing-dot" style={{ animationDelay: "160ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-primary/70 typing-dot" style={{ animationDelay: "320ms" }} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border bg-background">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 focus-within:border-primary/50 transition-colors">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              rows={1}
              placeholder="Type your answer…"
              className="flex-1 resize-none bg-transparent outline-none px-3 py-2 text-sm max-h-32"
            />
            <button
              onClick={send}
              disabled={!input.trim() || aiTyping}
              className="h-9 w-9 grid place-items-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">Press Enter to send · Shift+Enter for a new line</p>
        </div>
      </div>
    </div>
  );
}
