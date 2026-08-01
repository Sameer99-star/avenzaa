import { candidates, jobs, type Candidate, type Job } from "./mockData";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function listJobs(): Promise<Job[]> {
  await delay(220);
  return jobs;
}

export async function getJob(id: string): Promise<Job | undefined> {
  await delay(180);
  return jobs.find((j) => j.id === id);
}

export async function listCandidates(filter?: { jobId?: string }): Promise<Candidate[]> {
  await delay(260);
  return filter?.jobId ? candidates.filter((c) => c.jobId === filter.jobId) : candidates;
}

export async function getCandidate(id: string): Promise<Candidate | undefined> {
  await delay(200);
  return candidates.find((c) => c.id === id);
}

export async function copilotSearch(query: string): Promise<{ candidate: Candidate; reason: string }[]> {
  await delay(900);
  const q = query.toLowerCase();
  const scored = candidates.map((c) => {
    let score = 0;
    const reasons: string[] = [];
    if (/kafka/.test(q) && c.skills.includes("Kafka")) { score += 3; reasons.push("Kafka in stack"); }
    if (/kubernetes|k8s/.test(q) && c.skills.includes("Kubernetes")) { score += 3; reasons.push("Kubernetes production experience"); }
    if (/backend/.test(q) && /Backend/.test(c.role)) { score += 2; reasons.push("Backend Engineer applicant"); }
    if (/designer|design/.test(q) && /Designer/.test(c.role)) { score += 2; reasons.push("Product Design background"); }
    if (/data/.test(q) && /Data/.test(c.role)) { score += 2; reasons.push("Data Analyst applicant"); }
    if (/notice|30|days/.test(q) && c.noticePeriodDays <= 30) { score += 2; reasons.push(`${c.noticePeriodDays}-day notice`); }
    const yearsMatch = q.match(/(\d+)\+?\s*years?/);
    if (yearsMatch && c.yearsExperience >= Number(yearsMatch[1])) { score += 2; reasons.push(`${c.yearsExperience}y experience`); }
    const scoreMatch = q.match(/(\d+)%/);
    if (scoreMatch && c.matchScore >= Number(scoreMatch[1])) { score += 2; reasons.push(`${c.matchScore}% match`); }
    if (/hired|ready|top/.test(q) && c.matchScore >= 85) { score += 2; reasons.push("Interview-ready"); }
    if (/gap|flag/.test(q) && c.breakdown.some((b) => b.match === "gap")) { score += 2; reasons.push("Has flagged skill gap"); }
    if (/europe|eu|remote/.test(q) && (c.location.includes("EU") || /Berlin|Lisbon|Amsterdam|London|Paris|Warsaw/.test(c.location))) {
      score += 1; reasons.push(`Based in ${c.location}`);
    }
    return { candidate: c, score, reason: reasons.slice(0, 2).join(" · ") || `Match score ${c.matchScore}%` };
  });
  const results = scored.filter((r) => r.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);
  if (results.length === 0) {
    return candidates.slice(0, 3).map((c) => ({ candidate: c, reason: `Closest match by profile · ${c.matchScore}%` }));
  }
  return results.map(({ candidate, reason }) => ({ candidate, reason }));
}
