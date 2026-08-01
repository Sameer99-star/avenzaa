export type JobStatus = "open" | "closed" | "draft";
export type CandidateStage = "applied" | "screened" | "shortlisted" | "hired" | "rejected";

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  status: JobStatus;
  description: string;
  requirements: string[];
  skills: string[];
  applicantCount: number;
  createdAt: string;
}

export interface ScoreBreakdown {
  requirement: string;
  match: "met" | "partial" | "gap";
  evidence: string;
}

export interface ChatTurn {
  role: "ai" | "candidate";
  text: string;
}

export interface Candidate {
  id: string;
  anonId: string;
  name: string;
  email: string;
  role: string;
  jobId: string;
  matchScore: number;
  stage: CandidateStage;
  yearsExperience: number;
  currentCompany: string;
  location: string;
  noticePeriodDays: number;
  skills: string[];
  breakdown: ScoreBreakdown[];
  transcript: ChatTurn[];
  appliedAt: string;
}

export const jobs: Job[] = [
  {
    id: "job-be",
    title: "Senior Backend Engineer",
    department: "Engineering",
    location: "Remote · EU",
    status: "open",
    description:
      "Own core services powering our data pipeline. Work closely with product and platform to ship reliable, observable systems at scale.",
    requirements: ["3+ years backend engineering", "Strong with Go or Java", "Kafka or streaming systems", "Comfort with on-call"],
    skills: ["Go", "Kafka", "PostgreSQL", "Kubernetes", "gRPC"],
    applicantCount: 47,
    createdAt: "2026-06-14",
  },
  {
    id: "job-pd",
    title: "Product Designer",
    department: "Design",
    location: "Berlin · Hybrid",
    status: "open",
    description: "Shape end-to-end product experience for our recruiter suite. Collaborate tightly with engineering and PM.",
    requirements: ["4+ years product design", "Portfolio with shipped SaaS work", "Fluency in Figma", "Systems thinking"],
    skills: ["Figma", "Design Systems", "Prototyping", "User Research"],
    applicantCount: 62,
    createdAt: "2026-06-22",
  },
  {
    id: "job-da",
    title: "Data Analyst",
    department: "Analytics",
    location: "Remote · Global",
    status: "open",
    description: "Turn recruiter and pipeline data into decisions. Build dashboards, ship insights, and partner with GTM.",
    requirements: ["2+ years analytics", "SQL fluency", "Experience with BI tools", "Statistical reasoning"],
    skills: ["SQL", "dbt", "Looker", "Python"],
    applicantCount: 31,
    createdAt: "2026-07-01",
  },
  {
    id: "job-do",
    title: "DevOps Engineer",
    department: "Platform",
    location: "Remote · EU",
    status: "open",
    description: "Own cloud infrastructure, CI/CD, and reliability. Push us toward a boring, well-observed platform.",
    requirements: ["3+ years DevOps/SRE", "Kubernetes in production", "Terraform", "AWS or GCP"],
    skills: ["Kubernetes", "Terraform", "AWS", "Prometheus", "GitHub Actions"],
    applicantCount: 24,
    createdAt: "2026-07-10",
  },
  {
    id: "job-fe",
    title: "Frontend Engineer",
    department: "Engineering",
    location: "Remote · EU",
    status: "closed",
    description: "Ship polished product surfaces in React and TypeScript.",
    requirements: ["3+ years React", "TypeScript", "Accessibility instincts"],
    skills: ["React", "TypeScript", "CSS"],
    applicantCount: 58,
    createdAt: "2026-05-02",
  },
];

const first = ["Amelia", "Noah", "Priya", "Diego", "Sana", "Marcus", "Ines", "Kenji", "Fatima", "Luca", "Yara", "Elias", "Zoe", "Rohan", "Nora", "Adam", "Tessa", "Jonas", "Aisha", "Rafael"];
const last = ["Okafor", "Andersen", "Kapoor", "Ramos", "Ahmed", "Weber", "Costa", "Tanaka", "Haddad", "Rossi", "Salim", "Larsen", "Vidal", "Chen", "Beck", "Novak", "Duarte", "Hill", "Rahimi", "Silva"];

function pick<T>(arr: T[], i: number): T { return arr[i % arr.length]; }

const transcriptTemplate = (name: string, role: string, years: number, gap: boolean): ChatTurn[] => [
  { role: "ai", text: `Hi ${name.split(" ")[0]}, thanks for applying for the ${role} role. I'll ask a few quick questions — should take about 5 minutes. Ready?` },
  { role: "candidate", text: "Yes, ready when you are." },
  { role: "ai", text: `Tell me briefly about your current role and how many years you've been working with the core stack for this position.` },
  { role: "candidate", text: `I'm currently at a mid-stage startup working on distributed systems. I have around ${years} years of relevant hands-on experience.` },
  { role: "ai", text: "Nice. Can you walk me through a project where you had to design a system for scale — what tradeoffs did you make?" },
  { role: "candidate", text: "We built an event ingestion pipeline handling ~40k events/sec. We chose Kafka over SQS for replay guarantees and used tiered storage to keep costs manageable." },
  { role: "ai", text: gap ? "Got it. This role also expects hands-on Kubernetes ownership in production — how would you rate your experience there?" : "Great context. How do you approach on-call and incident response in your current team?" },
  { role: "candidate", text: gap ? "Honestly, I've deployed to Kubernetes but haven't owned cluster operations directly — that would be a growth area for me." : "We run a follow-the-sun rotation. I've led two Sev-1 postmortems this year focused on blast radius reduction." },
  { role: "ai", text: "Last one — describe a time you disagreed with a teammate on a technical decision. How did you resolve it?" },
  { role: "candidate", text: "We disagreed on whether to introduce a new database. I built a small prototype comparing both paths, we reviewed together, and ended up choosing the simpler option. The evidence made the decision easy." },
  { role: "ai", text: "Perfect — that's everything I needed. You're all set. Our team will review your conversation and get back to you within a few days." },
];

function makeCandidate(i: number, job: Job): Candidate {
  const name = `${pick(first, i)} ${pick(last, i * 3 + 1)}`;
  const years = 2 + ((i * 7) % 9);
  const score = 42 + ((i * 13) % 54);
  const hasGap = score < 78;
  const stages: CandidateStage[] = ["applied", "screened", "shortlisted", "hired", "rejected"];
  const stage = score > 85 ? (i % 5 === 0 ? "hired" : "shortlisted") : score > 65 ? "screened" : score > 50 ? "applied" : stages[i % 5];
  const noticeOptions = [15, 30, 45, 60, 90];
  const notice = noticeOptions[i % noticeOptions.length];
  const requiredSkills = job.skills;
  const candidateSkills = requiredSkills.slice(0, hasGap ? Math.max(2, requiredSkills.length - 2) : requiredSkills.length);

  const breakdown: ScoreBreakdown[] = job.requirements.map((req, idx) => {
    const match: ScoreBreakdown["match"] = hasGap && idx === job.requirements.length - 1 ? "gap" : idx === 1 && score < 70 ? "partial" : "met";
    return {
      requirement: req,
      match,
      evidence:
        match === "met"
          ? `${years} years hands-on experience, most recently at a Series B startup shipping to production.`
          : match === "partial"
            ? `Some exposure through side projects and one prior role, though not primary responsibility.`
            : `No direct evidence in resume or conversation. Candidate flagged this as a growth area.`,
    };
  });

  return {
    id: `cand-${i.toString().padStart(3, "0")}`,
    anonId: `Candidate #${(200 + i).toString()}`,
    name,
    email: `${name.toLowerCase().replace(" ", ".")}@example.com`,
    role: job.title,
    jobId: job.id,
    matchScore: score,
    stage,
    yearsExperience: years,
    currentCompany: pick(["Stripe", "Datadog", "Vercel", "Linear", "Cloudflare", "Notion", "Ramp", "Anthropic", "Figma", "Sentry"], i * 2),
    location: pick(["Berlin, DE", "Lisbon, PT", "Amsterdam, NL", "Warsaw, PL", "Remote · EU", "London, UK", "Paris, FR"], i),
    noticePeriodDays: notice,
    skills: candidateSkills,
    breakdown,
    transcript: transcriptTemplate(name, job.title, years, hasGap),
    appliedAt: `2026-07-${(1 + (i % 26)).toString().padStart(2, "0")}`,
  };
}

export const candidates: Candidate[] = Array.from({ length: 18 }, (_, i) =>
  makeCandidate(i, jobs[i % (jobs.length - 1)]),
);

export const activityFeed = [
  { id: "a1", text: "Amelia Okafor completed screening for Senior Backend Engineer", time: "12 min ago", kind: "screening" as const },
  { id: "a2", text: "You shortlisted 3 candidates for Product Designer", time: "1 hour ago", kind: "shortlist" as const },
  { id: "a3", text: "Co-pilot search: 'Kafka + <30d notice' returned 4 matches", time: "3 hours ago", kind: "copilot" as const },
  { id: "a4", text: "New candidate applied to Data Analyst", time: "5 hours ago", kind: "applied" as const },
  { id: "a5", text: "Noah Andersen moved to Hired for Frontend Engineer", time: "Yesterday", kind: "hired" as const },
];

export const funnelData = [
  { stage: "Applied", value: 214 },
  { stage: "Screened", value: 138 },
  { stage: "Shortlisted", value: 46 },
  { stage: "Hired", value: 9 },
];

export const timeToHireData = [
  { month: "Feb", days: 34 },
  { month: "Mar", days: 31 },
  { month: "Apr", days: 28 },
  { month: "May", days: 26 },
  { month: "Jun", days: 22 },
  { month: "Jul", days: 19 },
];

export const skillGapData = [
  { skill: "Kubernetes", count: 22 },
  { skill: "Kafka", count: 18 },
  { skill: "System Design", count: 15 },
  { skill: "Terraform", count: 11 },
  { skill: "gRPC", count: 8 },
];

export const teamMembers = [
  { name: "You", email: "you@avenza.com", role: "Admin" },
  { name: "Rhea Malik", email: "rhea@avenza.com", role: "Recruiter" },
  { name: "Tomás Ribeiro", email: "tomas@avenza.com", role: "Hiring Manager" },
  { name: "Sofia Lang", email: "sofia@avenza.com", role: "Recruiter" },
];

// Scripted screening flow used in the candidate chat page.
export const screeningScript: { question: string; followup?: string }[] = [
  { question: "Hi! I'm Ava, Avenza's screening assistant. Thanks for applying to the Senior Backend Engineer role. I'll ask a few quick questions — should take about 5 minutes. Ready to start?" },
  { question: "Great. To kick off — what's your current role, and how many years have you been working with backend systems at scale?" },
  { question: "Nice. Can you walk me through a system you designed or significantly rearchitected? What were the constraints?" },
  { question: "Thanks — that's a solid example. This role uses Kafka heavily for event streaming. How comfortable are you with Kafka in production?" },
  { question: "Understood. On the operational side — how do you think about on-call, alert design, and incident response?" },
  { question: "Almost done. Tell me about a time you disagreed with a teammate on a technical direction. How did that play out?" },
  { question: "One last thing — what's your notice period, and are you open to a hybrid setup based in Berlin or fully remote?" },
];

export const copilotExamples = [
  "Find candidates with Kafka experience and less than 30 days notice",
  "Who applied to Backend Engineer with 5+ years and matched over 80%?",
  "Show designers with shipped SaaS portfolios based in Europe",
  "Candidates flagged with Kubernetes gaps for Senior Backend Engineer",
  "Top 5 candidates hired-ready this month",
];
