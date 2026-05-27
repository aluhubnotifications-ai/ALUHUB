# ALUHub — AI Career Platform for African Students

> **Claude Builders Club Hackathon 2026 · Track: Economic Empowerment & Education**

**Live app:** https://aluhub.pages.dev  
**Backend API:** https://aluhub-server.onrender.com

---

## The Problem

Over 500 students at African Leadership University (ALU) and CMU-Africa graduate each year into a job market that wasn't built for them:

- Generic job boards show irrelevant listings from the wrong continent
- Career services are overstretched — one counsellor can't give 500 students personalised advice
- Students don't know which skills to build, which companies to target, or how to write a competitive cover letter
- Internship listings are scattered across WhatsApp groups, LinkedIn, and email forwards
- There is no single verified, structured pipeline from student → opportunity → hire

The result: talented African graduates lose months — sometimes years — to an information gap that their peers at well-funded universities never face.

---

## The Solution: ALUHub

ALUHub is a full-stack career platform built exclusively for ALU and CMU-Africa students. It connects verified students with internship and full-time opportunities posted directly by companies and the university's career office — and uses Claude AI throughout to give every student the kind of personalised career coaching that was previously only available to a lucky few.

**Claude is not a chatbot wrapper here. It is the career counsellor.**

---

## How Claude Is Used

ALUHub uses the Claude API across five distinct, purposeful workflows — each using the right model for the job:

### 1. AI Job Matching (`claude-sonnet-4-6`)
**Endpoint:** `POST /api/ai/match`

Claude reads the student's full profile — their CV, preferred roles, skills, major, graduation year, work-type preference — and scores every active job listing against it (in batches of 20). Each listing gets a 0–100 match score and 2–3 specific reasons. Results are cached in `ai_match_cache` so the dashboard always loads instantly.

```
Student uploads CV → Claude scores all 40+ listings → ranked feed with:
"87% match — strong Python fit, matches remote preference, location is Nairobi as requested"
```

### 2. AI Career Chat (`claude-opus-4-7`)
**Endpoint:** `POST /api/ai/chat`

A context-aware career assistant that knows the student's profile, their top matched jobs, and their skill gaps. Students ask questions like "Review my CV", "What skills do I need for a data role at Andela?" or "Draw my 6-month job search plan" — and get substantive, personalised answers, not generic advice.

Supports rich markdown responses including **career roadmap diagrams** (rendered via Mermaid.js), skills bar charts, and structured job search plans.

### 3. Compass — AI Career Guide (`claude-opus-4-7`)
**Endpoint:** `POST /api/ai/compass`

A multi-turn agentic career guide with **persistent sessions** — a student can close the app and resume the same conversation days later. Compass runs two modes:
- **Chat mode** — open-ended career exploration and planning
- **Interview prep mode** — simulated behavioural interviews with real-time feedback

### 4. AI Application Coach (`claude-opus-4-7`)
**Endpoint:** `POST /api/ai/coach`

Three-stage agentic pipeline for every job application:
1. **Draft** — Claude writes a personalised cover letter from the student's profile + job description
2. **Critique** — Claude reviews its own draft and flags weaknesses
3. **Refine** — Claude rewrites with the critique applied

Students see all three stages and can intervene at any point.

### 5. Company Research (`claude-sonnet-4-6`)
**Endpoint:** `POST /api/ai/company`

Before applying, students ask Claude to research a company — its mission, culture, typical roles, skills required, and likely interview questions — structured for an African market context.

### Technical Highlights

| Feature | Detail |
|---|---|
| **Prompt caching** | All system prompts use `cache_control: { type: 'ephemeral' }` — lower latency, lower cost on repeated calls |
| **Model routing** | Opus 4.7 for quality-critical outputs (chat, coaching, compass); Sonnet 4.6 for high-volume structured tasks (matching, research) |
| **Prompt injection protection** | All user text is sanitised — control chars stripped, XML envelope tags removed, fields length-clamped before reaching any prompt |
| **Truncation recovery** | Match endpoint salvages partial JSON arrays when `stop_reason === 'max_tokens'` |
| **Data minimisation** | Name, email, nationality, and the CV file itself are **never sent to Claude** — only career preferences and anonymised listing data |
| **Batch processing** | Job matching runs in parallel groups of 20 to stay within context limits |

---

## Impact

**Who benefits:**
- 500+ ALU/CMU-Africa students per cohort, with capacity to expand to partner universities across Africa
- Career services staff — AI handles the first layer of coaching at scale
- African companies posting roles — reach a pre-screened, CV-verified talent pool

**What changes for students:**
- A first-year student with no network gets the same quality career advice as one with an expensive private coach
- Students stop applying blindly — they see exactly why a job matches and what skill gap to close first
- Opportunities surface that students would never have found on their own

**Alignment with "Machines of Loving Grace":**
Dario Amodei's essay describes AI compressing decades of human progress — particularly in education and economic opportunity. ALUHub is a direct instantiation of that: a student with a smartphone and an ALU email address now has access to career intelligence that previously required either a prestigious alumni network or thousands of dollars in coaching fees. We're giving African students the same starting line.

---

## Ethical Alignment

- **No demographic data sent to Claude** — race, nationality, gender, and student ID are never in any prompt
- **Honest match scores** — Claude is explicitly instructed not to inflate scores; a 45% match is a genuine 45%, with clear reasoning
- **Year-based access control** — listings restricted to specific cohort years are enforced client- and server-side; no student sees opportunities they aren't eligible for
- **Transparent AI disclosure** — every AI-generated output is clearly labelled so students always know when they're reading Claude's output vs. real company content
- **CV stays on platform** — uploaded CV files are never forwarded to the API; only structured preference data (desired roles, skills, work type) reaches Claude

---

## Architecture

```
┌───────────────────────────────────────────────────────┐
│  Frontend — Cloudflare Pages                          │
│  React · https://aluhub.pages.dev                    │
│                                                       │
│  AI flows: match → chat → compass → coach → company  │
└──────────────────────┬────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼────────────────────────────────┐
│  Backend — Render  (Node.js + Express + TypeScript)   │
│  https://aluhub-server.onrender.com                   │
│                                                       │
│  /api/ai/chat      claude-opus-4-7                    │
│  /api/ai/match     claude-sonnet-4-6  (cached)        │
│  /api/ai/coach     claude-opus-4-7   (3-stage agent)  │
│  /api/ai/compass   claude-opus-4-7   (multi-turn)     │
│  /api/ai/company   claude-sonnet-4-6                  │
└──────────────────────┬────────────────────────────────┘
                       │
┌──────────────────────▼────────────────────────────────┐
│  Database — Supabase (PostgreSQL)                     │
│  Custom auth · job_listings · ai_match_cache          │
│  profiles · applications · compass_sessions           │
└───────────────────────────────────────────────────────┘
```

**Stack:** React, Express, TypeScript, Supabase, Cloudflare Pages, Render, Claude API (Anthropic)

---

## Demo Accounts

All passwords: `Demo2026!`

| Role | Email |
|---|---|
| Student | Sign up with any `@alustudent.com` email |
| Company | `andela@aluhub.com` |
| Company | `flutterwave@aluhub.com` |
| School / Career Services | `careers@alu.edu` |

---

## Running Locally

### Backend
```bash
cd server
cp .env.example .env        # add ANTHROPIC_API_KEY + Supabase keys
npm install
npm run dev                 # http://localhost:4000
```

### Frontend
```bash
cd client
npm install
node scripts/build-legacy.mjs   # compile the UI bundle
npm run dev                     # http://localhost:5173
```

### Database
Run SQL files in order against your Supabase project:
1. `server/db/schema.sql`
2. `server/db/custom_auth.sql`
3. `server/db/migration_school_and_apply_modes.sql`
4. `server/db/seed_companies_and_jobs.sql`
5. `server/db/seed_school_and_apply_modes.sql`

---

## Internal Architecture Notes

- **`client/legacy-src/ALUHub.js`** — main production UI (compiled by esbuild into `client/public/app/`)
- **`server/src/routes/ai.ts`** — all Claude API calls with prompt caching, sanitisation, and model routing
- **`server/db/`** — SQL migrations, all idempotent and safe to re-run
- **Custom auth** — `public.app_users` table (not Supabase Auth), bcrypt cost 12, JWT access + httpOnly refresh tokens
- **PWA** — installable on Android/iOS, push notifications via Web Push API, service worker for offline support
