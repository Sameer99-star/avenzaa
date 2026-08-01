# Talent Connect

Project name: Avenza

Build Avenza — a premium AI-powered HR recruitment platform, positioned as "Intercom meets ChatGPT for hiring." This is a portfolio-grade SaaS product, not a generic CRUD dashboard. The bar is: a recruiter or candidate should look at this and think it's a funded startup's product, not a student project.

═══════════════════════════════

CRITICAL TECH CONSTRAINTS (do not deviate)

═══════════════════════════════

- Use plain Vite + React + React Router (react-router-dom) for routing.

- Do NOT use TanStack Start, TanStack Router, or any SSR framework. This must be a client-side SPA that builds to static files and deploys on Vercel with zero server requirement.

- Styling: Tailwind CSS.

- Use mock/local JSON data for everything right now — no real backend calls. Structure all mock data and API-shaped functions in a single `src/lib/mockData.ts` and `src/lib/mockApi.ts` file so it's trivial to swap for real GraphQL/REST calls later.

- Fully responsive, but design primarily for desktop/web app usage (recruiters work on laptops).

═══════════════════════════════

DESIGN DIRECTION

═══════════════════════════════

Premium, calm, confident SaaS aesthetic — think Linear, Intercom, and Vercel's dashboard, not a generic admin template.

- Clean sans-serif typography, generous whitespace, subtle shadows instead of heavy borders.

- One confident accent color (deep indigo or teal — pick one and use it consistently for primary actions, active states, and chat bubbles).

- Neutral gray/off-white base palette, dark mode included as a toggle.

- Micro-interactions: smooth hover states, subtle transitions on page/panel changes, typing indicators in chat, skeleton loaders instead of spinners.

- Avoid: generic bootstrap-looking cards, harsh primary blue (#0000FF-ish), clip-art style icons. Use a clean icon set (lucide-react).

═══════════════════════════════

CORE PAGES & FLOWS

═══════════════════════════════

1. LANDING PAGE

   - Hero: "Hiring, but it feels like a conversation." Subtext explaining Avenza screens candidates conversationally and gives recruiters an AI co-pilot over their entire talent pool.

   - Visual: an animated/static chat mockup showing a candidate screening conversation.

   - Sections: how it works (3 steps: candidate chats → AI screens & scores → recruiter reviews with co-pilot), feature highlights (conversational screening, explainable match scoring, recruiter co-pilot search, bias-aware screening), CTA to "Try demo" leading into the dashboard.

2. CANDIDATE SCREENING CHAT (the signature experience)

   - Full-screen chat interface, NOT a form. Candidate lands here after "applying" to a mock job.

   - AI asks conversational screening questions one at a time, chat-bubble style, with typing indicator animation.

   - Show a subtle progress indicator ("Question 3 of ~8") without making it feel like a form.

   - On completion, show a friendly "You're all set" screen with next steps.

   - Use mock scripted Q&A flow with a realistic multi-turn conversation (5-8 exchanges) covering technical skills, experience gaps, and a couple of soft/behavioral questions.

3. RECRUITER DASHBOARD (main hub after login)

   - Sidebar nav: Dashboard, Jobs, Candidates, Co-pilot, Analytics, Settings.

   - Dashboard home: pipeline funnel widget (Applied → Screened → Shortlisted → Hired), recent activity feed, quick stats cards (open roles, active candidates, avg time-to-screen).

4. JOBS PAGE

   - List/grid of job postings with title, department, applicant count, status (open/closed).

   - Job detail view: description, required skills as tags, list of candidates who applied with their match scores visible inline.

   - "Create job" flow (modal or page) with a form for title/description/required skills.

5. CANDIDATE PROFILE PAGE (the explainability showcase — make this excellent)

   - Candidate summary card: name, role applied for, overall match score as a clean circular/bar indicator.

   - "Why this score" section: a clear breakdown showing specific resume highlights mapped against specific job requirements — e.g. a two-column or annotated view, "Required: 3+ years React" paired with "Found: 4 years React at [Company]" with a checkmark, and gaps shown with a neutral flag icon, not a red X (keep it constructive, not punitive).

   - Full screening chat transcript, collapsible/scrollable.

   - A visible toggle: "View redacted profile" — when switched on, name/photo/gender-coded details are visually masked/blurred in the display to demonstrate the bias-aware screening layer. This should feel like a real feature demo, not an afterthought.

6. RECRUITER CO-PILOT (second signature experience)

   - A chat-style search interface separate from candidate screening chat — this is the recruiter typing natural language queries like "find candidates with Kafka experience and less than 30 days notice period."

   - Results render as candidate cards inline in the chat thread with a one-line AI explanation of why each matched, plus match score.

   - Include 4-5 realistic pre-scripted example queries the user can click to try instantly (huge for demo day).

7. ANALYTICS PAGE

   - Simple, clean charts (use recharts): pipeline funnel over time, time-to-hire trend, top skill gaps across rejected candidates.

8. SETTINGS PAGE

   - Company profile, team members (mock list), basic notification preferences. Keep this simple — it's not the star of the demo.

═══════════════════════════════

DATA TO MOCK

═══════════════════════════════

- 4-5 job postings across different roles (e.g. Backend Engineer, Product Designer, Data Analyst, DevOps Engineer).

- 15-20 candidate profiles with varied match scores (40%-95% range), varied screening transcript lengths, and at least a few with visible skill gaps for the explainability view to look meaningful.

- Realistic names, but make sure the redaction toggle has a clear before/after (name replaced with "Candidate #204"-style anonymized ID, photo replaced with a neutral placeholder).

═══════════════════════════════

DO NOT MISS

═══════════════════════════════

- Loading/skeleton states wherever data would normally take time (chat responses, search results).

- Empty states designed properly (e.g. "No candidates yet" with a clear CTA), not blank pages.

- Consistent spacing/grid system across every page — this is what makes it feel premium vs template-y.

- Dark mode toggle that actually works across every page.

- Every interactive element (buttons, toggles, nav) should have a clear hover/active state — nothing should feel static or dead.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a5d6e004-cb6c-4c25-b064-66fc400f9ffb).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
