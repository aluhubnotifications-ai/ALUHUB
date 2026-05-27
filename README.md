# ALUHub Internship Portal — AI-Powered Discovery & Matching

> **Project Name:** ALUHub Internship Portal — Centralized Discovery & AI Matching  
> **Track:** Education & Career Services for African Leadership University  
> **Claude Builders Club Hackathon 2026 · Economic Empowerment & Education**

**Live app:** https://aluhub.pages.dev  
**Backend API:** https://aluhub-server.onrender.com  
**GitHub:** https://github.com/aluhubnotifications-ai/ALUHUB

---

## The Problem: Internship Discovery Takes Too Long

Right now, ALU students face a real barrier: **internship opportunities are scattered across many websites, and filtering through them wastes precious time.**

Students find internships on:
- LinkedIn
- Company websites
- Job boards
- Email announcements
- Partner sites
- WhatsApp groups

**As a result:**
- You spend 10+ minutes filtering across websites instead of **actually applying**
- You miss good opportunities because they're buried
- You apply to roles that don't fit, hoping something sticks
- You lose motivation after the 5th website search

**The waste:** In a competitive market, time spent filtering is time you're not applying. And applying more ≈ getting hired faster.

---

## The Solution: ALUHub Internship Portal

**ALUHub** is a platform that brings internship opportunities into one place, filters them for your year, and uses Claude AI to help you find the best matches.

### Here's What's Different

✅ **One place to check** — all internship opportunities for your year in one app  
✅ **Pre-filtered for you** — only see internships your year is eligible for  
✅ **Two apply modes** — quick in-app form (if ALU posts it) OR external link to company site (if it's a partner opportunity)  
✅ **AI Job Matcher** — upload your resume → Claude scores each job for fit (0–100%)  
✅ **AI Company Research** — learn what a company does before you apply  
✅ **Scalable** — other schools can join and post their own internships

### How It Works

**For ALU Students:**
1. Log in and set your year (Year 1, 2, 3, or 4)
2. Browse internships — only see roles for your year
3. Click "Apply" → either submit our quick form OR go to the company's website
4. Optional: Use AI Matcher to see job fit scores

**For ALU Career Services (School):**
1. Post an internship (your own or from a partner company)
2. Choose: apply in-app (we handle it) or external link (company handles it)
3. Set year restrictions (all years? Year 3+? Only Year 4?)
4. If it's a partner company opportunity, add their name + logo
5. Students in that year see it immediately

**For Companies:**
1. Send internship to ALU Career Services
2. ALU decides how to post it (native or external link)
3. Applications arrive via our form or your site, depending on mode

### The Two Apply Modes Explained

**Mode 1: Native (In-App Apply)**
- ALU posts the internship directly on ALUHub
- You fill a quick form on our platform
- Your application goes straight to the company
- Fast, no extra clicks

**Mode 2: External Link (Company's Site)**
- ALU posts the internship with a link to the company
- You click "Apply" → opens company's website in a new tab
- You apply using their form
- Company keeps full control of their application process

**Both types appear the same in your feed.** You see company name, logo, and job details. The only difference is where the "Apply" button takes you.

### Expanding to Other Schools

Not just ALU — any education institution can:
- Post internships for **their own students**
- Post internships from **partner companies**
- Set year-based restrictions (decide who sees what)
- Choose: in-app or external link
- All through the same ALUHub platform

---

## How Claude AI Saves You Time

Claude powers two AI features that help you focus on quality applications:

### 1. AI Job Matcher
**Simple explanation:** You upload your resume. Claude reads each internship description and compares it to your profile. Then Claude tells you how good a match each role is.

**What you see:**
- Match score (0–100%)
- 2–3 specific reasons why it's a good/bad fit
- Which of your skills they want
- What skills you might be missing

**Impact:** You focus on roles where you have 70%+ match, not spray-and-pray applications.

### 2. AI Company Research
**Simple explanation:** You click a company name. Claude researches what that company does and tells you what to expect.

**What you see:**
- What the company does
- What they're known for in the market
- Types of roles they typically hire for
- What to expect in interviews

**Impact:** You walk into applications (and interviews) prepared and confident.

---

## Impact: What Changes

### For Students
- **Reduce filtering time:** from 10+ minutes → 1 minute per session
- **Increase applications:** when discovery is fast, you apply to more roles
- **Better matches:** AI helps you pick roles where you actually fit
- **Interview prep:** company research = walking in prepared

### For Schools
- **Centralized posting:** one place to curate and share internships
- **Year-based control:** restrict opportunities fairly (Year 3 roles for Year 3 students only)
- **Third-party posting:** forward partner opportunities without manual coordination
- **Trackable data:** see where students get internships

### For Companies
- **Flexible apply:** use our form (quick) or your own (full control)
- **Targeted reach:** only shown to students in relevant years
- **Pre-vetted talent:** students using AI matching are more likely to succeed in role

---

## How Claude Powers ALUHub (Technical Details)

ALUHub uses Claude API for three core internship features:

### 1. Job Matching (`claude-sonnet-4-6`)
**Endpoint:** `POST /api/ai/match`

Claude reads student profile (resume + preferences) and scores each internship listing (batches of 20). Every listing gets a 0–100 match score + 2–3 reasons. Results cached in database so dashboard loads instantly.

```
Student upload → Claude scores all listings → ranked feed:
"85% match — strong skills alignment, prefers remote, location match"
```

### 2. Company Research (`claude-sonnet-4-6`)
**Endpoint:** `POST /api/ai/company`

Student clicks a company → Claude researches: what they do, hiring patterns, interview prep, market position — all structured for African market context.

### 3. Career Chat (`claude-opus-4-7`)
**Endpoint:** `POST /api/ai/chat`

Context-aware career assistant. Student asks: "Review my CV", "What skills for a Data role?", "Create a 6-month job search plan" → gets personalised, substantive answers with diagrams and roadmaps.

### 4. Interview Prep Mode (`claude-opus-4-7`)
**Endpoint:** `POST /api/ai/compass`

Multi-turn agentic guide — simulated behavioural interviews with feedback. Sessions persist across days, so student can resume later.

### 5. Application Coach (`claude-opus-4-7`)
**Endpoint:** `POST /api/ai/coach`

Three-stage cover letter pipeline:
1. **Draft** — Claude writes cover letter from student profile + job description
2. **Critique** — Claude flags weaknesses in its own draft
3. **Refine** — Claude rewrites with feedback applied

Student sees all stages and can modify anytime.

### Technical Highlights

| Feature | Detail |
|---|---|
| **Prompt caching** | All system prompts use `cache_control: { type: 'ephemeral' }` — lower latency, lower cost |
| **Model routing** | Opus 4.7 for quality outputs (chat, coaching); Sonnet 4.6 for high-volume tasks (matching, research) |
| **Prompt injection protection** | All user text sanitised — control chars stripped, XML tags removed, fields length-clamped |
| **Truncation recovery** | Match endpoint salvages partial JSON when `stop_reason === 'max_tokens'` |
| **Data minimisation** | CV file never sent to Claude — only structured preferences + anonymised listing data |
| **Batch processing** | Job matching runs in parallel groups of 20 to respect context limits |

---

## Why This Matters

### For Students
You get your time back. Instead of 10 minutes filtering → 2 minutes applying, you get 1 minute discovering → 2 minutes applying. That's 9 extra minutes per day to apply to more roles, or to focus on interview prep.

Over a semester, that's **hours back in your life** and **more applications sent**.

### For ALU Career Services
You post once. AI handles the routing, matching, and coaching at scale. One counsellor can now support 500+ students with AI-augmented career guidance, not just email triage.

### For Companies
You get pre-vetted, pre-matched applicants. Students applying through ALUHub have already seen exactly why they fit your role. Higher intent = higher quality hires.

### For Education at Scale
Other schools can use the same platform. Internship discovery becomes a **solved problem** for any school, not a chaotic manual process. We're building infrastructure that scales across Africa.

---

## Ethical Safeguards

- **No demographic data to Claude** — race, nationality, gender never in prompts
- **Honest match scores** — 45% is genuinely 45%, with clear reasoning
- **Year-based enforcement** — year-restricted listings enforced client + server-side
- **AI transparency** — every AI output clearly labelled
- **CV safety** — uploaded CVs never reach Claude; only anonymised preference data sent

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

---

## Demo Accounts

All passwords: `Demo2026!`

| Role | Email |
|---|---|
| Student | Sign up with any `@alustudent.com` email |
| Company | `andela@aluhub.com` |
| Company | `flutterwave@aluhub.com` |
| Company | `mpharma@aluhub.com` |
| Company | `oneacrefund@aluhub.com` |
| Company | `equitybank@aluhub.com` |
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
