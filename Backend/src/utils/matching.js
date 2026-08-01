const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function callGroqJSON(systemPrompt, userContent) {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

async function callGroqText(systemPrompt, userContent) {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Generates an explainable match score between a job and a candidate.
 *
 * IMPORTANT — bias mitigation: this function is deliberately given the
 * REDACTED profile (skills + years of experience only — no name, no
 * education institution, no anything gender- or age-coded), not the full
 * resume. This is the "PII redaction before scoring" pattern: the model
 * physically cannot use identity-adjacent signals to score someone,
 * because those signals were stripped before the prompt was built.
 */
async function generateMatchExplanation({ job, redactedProfile }) {
  const systemPrompt = `You are an unbiased technical recruiter assistant. You will score how well a candidate matches a job, based ONLY on skills and years of experience — you have deliberately not been given the candidate's name, education institution, or any other identity-linked information, to avoid bias.

Respond with ONLY a JSON object in exactly this shape, no markdown fences:
{
  "score": <integer 0-100>,
  "matchedRequirements": ["<short phrase citing a specific matched skill/requirement>", ...],
  "gaps": ["<short phrase naming a specific missing requirement>", ...],
  "summary": "<one or two sentence neutral summary of the fit>"
}

Be specific — cite the actual skill names from the job requirements and the candidate's skill list, don't be vague.`;

  const userContent = `JOB TITLE: ${job.title}
JOB DESCRIPTION: ${job.description}
REQUIRED SKILLS: ${job.requiredSkills.join(', ')}
NICE-TO-HAVE SKILLS: ${(job.niceToHaveSkills || []).join(', ')}

CANDIDATE (redacted — identity information withheld):
Anonymized ID: ${redactedProfile.anonymizedId}
Skills: ${redactedProfile.skills.join(', ')}
Years of experience: ${redactedProfile.yearsExperience}`;

  return callGroqJSON(systemPrompt, userContent);
}

/**
 * Generates a one-line "why this candidate matched your search" summary
 * for the recruiter co-pilot search results.
 */
async function generateSearchSummary({ searchQuery, redactedProfile }) {
  const systemPrompt = `You are a recruiter co-pilot. A recruiter searched for candidates using a natural language query. Given the search query and one candidate's redacted profile, write ONE short sentence (under 25 words) explaining why this candidate is a relevant result. Be specific and reference actual skills. Do not use markdown. Respond with plain text only, no quotes.`;

  const userContent = `SEARCH QUERY: "${searchQuery}"

CANDIDATE:
Skills: ${redactedProfile.skills.join(', ')}
Years of experience: ${redactedProfile.yearsExperience}`;

  return callGroqText(systemPrompt, userContent);
}

module.exports = { generateMatchExplanation, generateSearchSummary };
