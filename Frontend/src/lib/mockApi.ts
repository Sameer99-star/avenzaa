import type { Candidate, Job, ChatTurn, ScoreBreakdown } from "./mockData";

// Your live backend on Render. Change this if you redeploy elsewhere.
const API_URL = "https://avenza-backend-egez.onrender.com/graphql";

// Demo recruiter account (seeded via seed.js). The frontend auto-logs in
// with this so you don't need a login page wired up yet.
const DEMO_EMAIL = "demo@avenza.com";
const DEMO_PASSWORD = "demo1234";

function formatDate(value: string): string {
  const num = Number(value);
  const date = !isNaN(num) && value.trim() !== "" ? new Date(num) : new Date(value);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

let cachedToken: string | null = null;

async function getToken(): Promise<string> {
  if (cachedToken) return cachedToken;

  const stored = typeof window !== "undefined" ? localStorage.getItem("avenza_token") : null;
  if (stored) {
    cachedToken = stored;
    return stored;
  }

  const res = await gqlRaw(
    `mutation { login(email: "${DEMO_EMAIL}", password: "${DEMO_PASSWORD}") { token } }`,
  );
  const token = res.data.login.token;
  cachedToken = token;
  if (typeof window !== "undefined") localStorage.setItem("avenza_token", token);
  return token;
}

// Low-level GraphQL call, no auth — used only for the login call itself.
async function gqlRaw(query: string, variables?: Record<string, unknown>) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0]?.message || "GraphQL error");
  return json;
}

// Authenticated GraphQL call — used for everything else.
async function gql(query: string, variables?: Record<string, unknown>) {
  const token = await getToken();
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) {
    // Token might be stale — clear it so the next call re-logs in.
    if (json.errors[0]?.extensions?.code === "UNAUTHENTICATED") {
      cachedToken = null;
      if (typeof window !== "undefined") localStorage.removeItem("avenza_token");
    }
    throw new Error(json.errors[0]?.message || "GraphQL error");
  }
  return json.data;
}

// ---- Mappers: backend shape -> frontend Job/Candidate types ----

function mapJob(j: any): Job {
  return {
    id: j.id,
    title: j.title,
    department: j.department || "—",
    location: "Remote", // not tracked in backend yet
    status: j.status,
    description: j.description,
    requirements: j.requiredSkills, // backend doesn't split these out separately yet
    skills: j.requiredSkills,
    applicantCount: j.applicantCount,
    createdAt: j.createdAt,
  };
}

function mapApplicationToCandidate(app: any, transcript: ChatTurn[] = []): Candidate {
  const candidate = app.candidate;
  const profile = candidate.structuredProfile;
  const redacted = candidate.redactedProfile;
  const explanation = app.matchExplanation;

  const breakdown: ScoreBreakdown[] = explanation
    ? [
        ...explanation.matchedRequirements.map((r: string) => ({
          requirement: r,
          match: "met" as const,
          evidence: explanation.summary,
        })),
        ...explanation.gaps.map((g: string) => ({
          requirement: g,
          match: "gap" as const,
          evidence: "No direct evidence in candidate's profile.",
        })),
      ]
    : [];

  return {
    id: app.id,
    anonId: redacted?.anonymizedId || "Candidate",
    name: candidate.name,
    email: candidate.email,
    role: app.job.title,
    jobId: app.job.id,
    matchScore: app.matchScore ?? 0,
    stage: app.stage.toLowerCase() as Candidate["stage"],
    yearsExperience: profile?.yearsExperience ?? 0,
    currentCompany: candidate.currentCompany || "—",
    location: candidate.location || "Remote",
    noticePeriodDays: profile?.noticePeriodDays ?? 30,
    skills: profile?.skills ?? [],
    breakdown,
    transcript,
    appliedAt: formatDate(app.createdAt),
  };
}

// ---- Public API (same function signatures as before) ----

export async function listJobs(): Promise<Job[]> {
  const data = await gql(`
    query {
      jobs {
        id title department description requiredSkills niceToHaveSkills status applicantCount createdAt
      }
    }
  `);
  return data.jobs.map(mapJob);
}

export async function getJob(id: string): Promise<Job | undefined> {
  const data = await gql(
    `query GetJob($id: ID!) {
      job(id: $id) {
        id title department description requiredSkills niceToHaveSkills status applicantCount createdAt
      }
    }`,
    { id },
  );
  return data.job ? mapJob(data.job) : undefined;
}

export async function listCandidates(filter?: { jobId?: string }): Promise<Candidate[]> {
  const data = await gql(
    `query ListApplications($jobId: ID) {
      applications(jobId: $jobId) {
        id stage matchScore createdAt
        matchExplanation { matchedRequirements gaps summary }
        candidate {
          id name email location currentCompany
          structuredProfile { skills yearsExperience education noticePeriodDays }
          redactedProfile { anonymizedId skills yearsExperience }
        }
        job { id title }
      }
    }`,
    { jobId: filter?.jobId },
  );
  return data.applications.map((app: any) => mapApplicationToCandidate(app));
}

export async function getCandidate(id: string): Promise<Candidate | undefined> {
  const data = await gql(
    `query GetApplication($id: ID!) {
      application(id: $id) {
        id stage matchScore createdAt
        matchExplanation { matchedRequirements gaps summary }
        candidate {
          id name email location currentCompany
          structuredProfile { skills yearsExperience education noticePeriodDays }
          redactedProfile { anonymizedId skills yearsExperience }
        }
        job { id title }
      }
      screeningSession(applicationId: $id) {
        transcript { sender content }
      }
    }`,
    { id },
  );
  if (!data.application) return undefined;

  const transcript: ChatTurn[] = (data.screeningSession?.transcript ?? []).map((m: any) => ({
    role: m.sender === "ai" ? "ai" : "candidate",
    text: m.content,
  }));

  return mapApplicationToCandidate(data.application, transcript);
}

export async function copilotSearch(query: string): Promise<{ candidate: Candidate; reason: string }[]> {
  const data = await gql(
    `query Search($query: String!) {
      searchCandidates(query: $query, topK: 5) {
        score
        aiSummary
        application {
          id stage matchScore createdAt
          matchExplanation { matchedRequirements gaps summary }
          candidate {
            id name email
            structuredProfile { skills yearsExperience education noticePeriodDays }
            redactedProfile { anonymizedId skills yearsExperience }
          }
          job { id title }
        }
      }
    }`,
    { query },
  );

  return data.searchCandidates
    .filter((hit: any) => hit.application) // skip candidates with no application yet
    .map((hit: any) => ({
      candidate: mapApplicationToCandidate(hit.application),
      reason: hit.aiSummary,
    }));
}
export interface ScreeningSessionData {
  status: string;
  questionsAsked: number;
  transcript: ChatTurn[];
}

export async function getScreeningSession(applicationId: string): Promise<ScreeningSessionData> {
  const data = await gql(
    `query GetSession($applicationId: ID!) {
      screeningSession(applicationId: $applicationId) {
        status
        questionsAsked
        transcript { sender content }
      }
    }`,
    { applicationId },
  );
  return {
    status: data.screeningSession.status,
    questionsAsked: data.screeningSession.questionsAsked,
    transcript: data.screeningSession.transcript.map((m: any) => ({
      role: m.sender === "ai" ? "ai" : "candidate",
      text: m.content,
    })),
  };
}

export async function sendScreeningMessage(applicationId: string, content: string): Promise<ScreeningSessionData> {
  const data = await gql(
    `mutation SendMsg($applicationId: ID!, $content: String!) {
      sendScreeningMessage(applicationId: $applicationId, content: $content) {
        status
        questionsAsked
        transcript { sender content }
      }
    }`,
    { applicationId, content },
  );
  return {
    status: data.sendScreeningMessage.status,
    questionsAsked: data.sendScreeningMessage.questionsAsked,
    transcript: data.sendScreeningMessage.transcript.map((m: any) => ({
      role: m.sender === "ai" ? "ai" : "candidate",
      text: m.content,
    })),
  };
}

export interface DashboardStats {
  funnel: { stage: string; value: number }[];
  recentActivity: { id: string; text: string; time: string; kind: string }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const data = await gql(`
    query {
      dashboardStats {
        funnel { stage value }
        recentActivity { id text time kind }
      }
    }
  `);
  return data.dashboardStats;
}