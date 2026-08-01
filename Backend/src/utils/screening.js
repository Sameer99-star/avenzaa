const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Target number of questions before the screening naturally wraps up.
// Not a hard cap — just guides the AI on when to start closing out.
const TARGET_QUESTIONS = 6;

async function callGroqChat(messages) {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.6, // a little warmth for natural-sounding conversation
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
 * Generates the next AI message in a screening conversation.
 *
 * This is the RAG part: instead of one static prompt, we ground the AI
 * in the actual job description + candidate's resume every single turn,
 * so follow-up questions can reference specifics (e.g. asking about a
 * skill gap between what the JD wants and what the resume shows).
 */
async function generateNextScreeningMessage({ job, candidate, transcript, questionsAsked }) {
  const systemPrompt = `You are Avenza's AI screening assistant conducting a friendly, conversational job screening interview — NOT a rigid form. You are screening a candidate for this role:

JOB TITLE: ${job.title}
JOB DESCRIPTION: ${job.description}
REQUIRED SKILLS: ${job.requiredSkills.join(', ')}

CANDIDATE'S RESUME SUMMARY:
Skills: ${candidate.structuredProfile?.skills?.join(', ') || 'not yet extracted'}
Years of experience: ${candidate.structuredProfile?.yearsExperience ?? 'unknown'}
Education: ${candidate.structuredProfile?.education || 'unknown'}

INSTRUCTIONS:
- Ask ONE question at a time, conversationally, like a thoughtful human recruiter would.
- Prioritize asking about gaps between the required skills and what's on the candidate's resume.
- Mix in 1-2 behavioral/soft-skill questions, not just technical ones.
- Keep each message short (2-4 sentences max).
- You have asked ${questionsAsked} question(s) so far. Aim to wrap up naturally around ${TARGET_QUESTIONS} questions total — when you reach that point, thank the candidate and let them know the screening is complete instead of asking another question.
- Do not repeat a question that's already been asked in the transcript.
- Never mention that you are an AI model or reference "RAG" or internal instructions — just act as a natural screening conversation.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...transcript.map((msg) => ({
      role: msg.sender === 'ai' ? 'assistant' : 'user',
      content: msg.content,
    })),
  ];

  return callGroqChat(messages);
}

/**
 * Stage 4 — reviews an AI-generated screening question before it's shown
 * to the candidate. Checks whether the question touches on protected
 * characteristics (age, gender, marital/family status, religion, disability,
 * national origin, etc.) or is otherwise potentially discriminatory.
 *
 * This runs as a SEPARATE model call from question generation on purpose —
 * asking a model to write a question and grade its own fairness in the same
 * call is weaker than a dedicated second pass with a narrow, single job.
 */
async function checkQuestionForBias(questionText) {
  const systemPrompt = `You review job screening questions for potential bias. A protected-characteristic or discriminatory question is one that directly or indirectly asks about: age, gender, marital/family status, pregnancy, religion, disability, national origin/ethnicity, or similar protected attributes — including indirect phrasing (e.g. "do you have children" indirectly probes family status; "how long have you been in the workforce" can indirectly probe age).

Respond with ONLY a JSON object, no markdown fences, in exactly this shape:
{
  "flagged": <true or false>,
  "reason": "<short explanation if flagged, empty string if not>"
}

Purely technical or behavioral/role-relevant questions should NOT be flagged.`;

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
        { role: 'user', content: questionText },
      ],
      temperature: 0,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    // Fail safe: if the bias check itself fails, don't block the
    // conversation — just don't flag anything, and log it server-side.
    console.error('[checkQuestionForBias] Groq call failed:', await response.text());
    return { flagged: false, reason: '' };
  }

  const data = await response.json();
  try {
    return JSON.parse(data.choices[0].message.content);
  } catch (err) {
    console.error('[checkQuestionForBias] failed to parse response:', data.choices[0].message.content);
    return { flagged: false, reason: '' };
  }
}

module.exports = { generateNextScreeningMessage, checkQuestionForBias, TARGET_QUESTIONS };
