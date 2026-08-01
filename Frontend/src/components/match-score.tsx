import { cn } from "@/lib/utils";

export function MatchRing({ score, size = 56 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const c = 2 * Math.PI * radius;
  const offset = c - (score / 100) * c;
  const color =
    score >= 80 ? "text-[color:var(--success)]" : score >= 50 ? "text-[color:var(--accent-warm)]" : "text-muted-foreground";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className={cn("-rotate-90", color)}>
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={4} className="stroke-muted" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={4}
          strokeLinecap="round"
          className="stroke-current transition-[stroke-dashoffset] duration-700"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 6px color-mix(in oklab, currentColor 55%, transparent))` }}
        />
      </svg>
      <div className={cn("absolute inset-0 grid place-items-center text-[13px] font-semibold tabular", color)}>{score}</div>
    </div>
  );
}

export function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-[color:var(--success)]" : score >= 50 ? "bg-[color:var(--accent-warm)]" : "bg-muted-foreground";
  return (
    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
      <div className={cn("h-full transition-all", color)} style={{ width: `${score}%` }} />
    </div>
  );
}
