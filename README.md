# Avenza — Hiring, but it feels like a conversation

Avenza is an AI-powered HR recruitment platform — positioned as **"Intercom meets ChatGPT for hiring."** Instead of static forms and keyword filters, candidates are screened through an adaptive conversational chat, and recruiters get a natural-language co-pilot over their entire talent pool.

**Live demo:** https://avenza-frontend.onrender.com
*(hosted on Render's free tier — the first load after inactivity may take 30–50 seconds to wake up)*

Demo recruiter login: `demo@avenza.com` / `demo1234`

---

## What makes this different from a standard ATS

Most "AI hiring" projects bolt a chatbot onto a form. Avenza is built around four genuinely functional AI features:

1. **Conversational screening, grounded in RAG** — the screening chat isn't scripted. Every question is generated live by an LLM with the actual job description and the candidate's actual parsed resume as context, so it asks about real, specific gaps (e.g. noticing a required skill missing from a resume and asking about it directly).
2. **Recruiter co-pilot with semantic search** — recruiters search their candidate pool in plain English (*"candidates with Kubernetes experience and less than 30 days notice"*) instead of clicking through filters. Powered by vector embeddings, not keyword matching.
3. **Explainable, bias-aware match scoring** — every match score comes with cited evidence (specific matched skills, specific gaps) rather than an opaque percentage. Scoring is deliberately run against a **redacted** candidate profile (skills + experience only — no name, no education institution) so identity-linked signals can't influence the score, even accidentally.
4. **Bias-flagging on generated questions** — every AI-generated screening question passes through a second, independent model call that checks for questions touching protected characteristics before it reaches the candidate.

---

## Architecture

```
┌─────────────┐      GraphQL       ┌──────────────────┐
│   Frontend  │ ─────────────────▶ │     Backend       │
│  TanStack   │                    │  Node / Express /  │
│  Start +    │                    │  Apollo GraphQL    │
│  React      │                    └─────────┬─────────┘
└─────────────┘                              │
                                   ┌──────────┼──────────┬───────────────┐
                                   ▼          ▼          ▼               ▼
                              MongoDB   Upstash Redis  Upstash Vector   Groq
                             (data)    (BullMQ queue)  (embeddings +   (LLM —
                                                         semantic       screening,
                                                         search)        scoring,
                                                                        bias check)
```

Both services are deployed independently on Render:
- **Backend** — Node web service, `Backend/` root directory
- **Frontend** — Node web service (TanStack Start via Nitro, `NITRO_PRESET=node-server`), `Frontend/` root directory

---

## Tech stack

**Backend**
- Node.js, Express, Apollo GraphQL Server
- MongoDB + Mongoose (multi-tenant, scoped by `companyId` on every collection)
- BullMQ + Upstash Redis — async job queue for resume processing (upload returns immediately, structuring happens in the background)
- Groq (Llama 3.3 70B) — resume structuring, screening question generation, match scoring, bias review
- Upstash Vector — built-in embedding model (`openai/text-embedding-3-small`, hosted by Upstash); jobs and candidate profiles are embedded and semantically searchable
- Cloudinary — resume PDF storage
- JWT auth, role-based access (admin / recruiter / candidate)

**Frontend**
- React 19, TanStack Start (Vite + Nitro), TanStack Router, TanStack Query
- Tailwind CSS, Radix UI primitives
- Recharts for analytics visualizations

---

## RAG design — how retrieval actually happens

Two separate RAG pipelines:

**1. Screening conversation.** On every turn, the backend re-fetches the job description and the candidate's structured resume profile and includes them directly in the prompt context sent to Groq — not a single system prompt set once at the start of the conversation. This is what lets the AI reference specific, current information (a missing skill, years of experience) rather than asking generic questions.

**2. Recruiter co-pilot search.** Job descriptions and candidate profiles are embedded into Upstash Vector at creation/processing time. A recruiter's natural-language query is embedded the same way, and the top-k most similar candidate vectors are retrieved, then each result gets a one-line AI-generated explanation of why it matched — generated from the redacted profile only.

---

## Bias mitigation — the actual mechanism, not a claim

- `Candidate.redactedProfile` strips name, email, and education institution, keeping only skills and years of experience.
- `scoreApplication` and the co-pilot's search-result summaries are generated **exclusively** from this redacted profile — the LLM call has no access to identity-linked fields.
- Every AI-generated screening question is passed through a **separate** Groq call (`checkQuestionForBias`) whose only job is to flag questions touching protected characteristics (age, gender, family status, religion, disability, national origin, etc.), before the question is shown to the candidate. This runs as an independent second pass rather than asking one model call to grade its own output, which is a stronger design than self-grading in a single call.

---

## Local setup

### Backend
```bash
cd Backend
npm install
cp .env.example .env   # fill in MongoDB, Groq, Cloudinary, Redis, Upstash Vector credentials
npm run dev
```
GraphQL playground: `http://localhost:4000/graphql`

To seed realistic demo data (4 jobs, 9 candidates, pre-scored):
```bash
node src/seed.js
```

### Frontend
```bash
cd Frontend
npm install
npm run dev
```
Runs on `http://localhost:8081` by default. Update `API_URL` in `src/lib/mockApi.ts` to point at your local backend if not using the deployed one.

---

## Known limitations / future work

- Recruiter dashboard's pipeline funnel and activity feed are currently static demo visuals, not yet wired to live aggregation queries.
- No automated test suite yet.
- Resume parsing assumes a text-extractable PDF (no OCR fallback for scanned documents).
- Redis/BullMQ rate limits on free tiers mean very high concurrent upload volume isn't load-tested.

---

## Project stages (for reference)

| Stage | Scope | Status |
|---|---|---|
| 0 | Auth, multi-tenant schema, GraphQL API | ✅ |
| 1 | Resume upload, async queue, LLM extraction | ✅ |
| 2 | RAG-driven screening conversation | ✅ |
| 3 | Semantic candidate search, explainable scoring | ✅ |
| 4 | Bias-flagging layer | ✅ |
| 5 | Seed data, deployment | ✅ |