// Calls Groq's OpenAI-compatible chat completions endpoint to turn raw
// resume text into structured JSON. Using plain fetch (Node 18+ has it
// built in) instead of an SDK, to keep dependencies minimal.

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function extractStructuredProfile(resumeText) {
  const systemPrompt = `You are a resume parser. Given raw resume text, extract structured data and respond with ONLY a JSON object, no markdown fences, no preamble, in exactly this shape:
{
  "skills": ["skill1", "skill2"],
  "yearsExperience": <number>,
  "education": "<highest degree + institution as one short string>",
  "noticePeriodDays": <number or null if not mentioned>
}`;

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
        { role: 'user', content: resumeText.slice(0, 8000) }, // guard against huge resumes
      ],
      temperature: 0.1, // low temperature — this is extraction, not creative writing
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const rawContent = data.choices[0].message.content;

  try {
    return JSON.parse(rawContent);
  } catch (err) {
    throw new Error(`Failed to parse Groq JSON output: ${rawContent}`);
  }
}

module.exports = { extractStructuredProfile };
