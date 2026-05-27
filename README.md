# ALUHub Internship Portal — AI-Powered Discovery & Matching

> **Project Name:** ALUHub Internship Portal  
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

## Technical: How Claude Powers ALUHub

### 1. Job Matching (`claude-sonnet-4-6`)
**Endpoint:** `POST /api/ai/match`

Claude reads student profile (resume + preferences) and scores each internship listing (batches of 20). Every listing gets a 0–100 match score + 2–3 reasons. Results cached in database so dashboard loads instantly.

### 2. Company Research (`claude-sonnet-4-6`)
**Endpoint:** `POST /api/ai/company`

Student clicks a company → Claude researches: what they do, hiring patterns, interview prep, market position.

### 3. Career Chat (`claude-opus-4-7`)
**Endpoint:** `POST /api/ai/chat`

Context-aware career assistant. Student asks: "Review my CV", "What skills for a Data role?", "Create a 6-month job search plan" → gets personalised, substantive answers with diagrams and roadmaps.

### 4. Interview Prep Mode (`claude-opus-4-7`)
**Endpoint:** `POST /api/ai/compass`

Multi-turn agentic guide — simulated behavioural interviews with feedback. Sessions persist across days.

### 5. Application Coach (`claude-opus-4-7`)
**Endpoint:** `POST /api/ai/coach`

Three-stage cover letter pipeline: Draft → Critique → Refine with student able to modify at any stage.

### Technical Highlights

| Feature | Detail |
|---|---|
| **Prompt caching** | All system prompts use `cache_control: { type: 'ephemeral' }` — lower latency, lower cost |
| **Model routing** | Opus 4.7 for quality outputs (chat, coaching); Sonnet 4.6 for high-volume tasks (matching, research) |
| **Prompt injection protection** | All user text sanitised — control chars stripped, XML tags removed, fields length-clamped |
| **Truncation recovery** | Match endpoint salvages partial JSON when `stop_reason === 'max_tokens'` |
| **Data minimisation** | CV file never sent to Claude — only structured preferences + anonymised listing data |
| **Batch processing** | Job matching runs in parallel groups of 20 to respect context limits |

### Ethical Safeguards

- **No demographic data to Claude** — race, nationality, gender never in prompts
- **Honest match scores** — 45% is genuinely 45%, with clear reasoning
- **Year-based enforcement** — year-restricted listings enforced client + server-side
- **AI transparency** — every AI output clearly labelled
- **CV safety** — uploaded CVs never reach Claude; only anonymised preference data sent

---

## Architecture

```
ALUHUB/
├── client/   Web frontend  — Vite + React + TypeScript
├── server/   Backend API   — Node.js + Express + TypeScript
└── mobile/   Mobile app    — Flutter (Dart)
```

- **Database:** PostgreSQL via Supabase. Keys live in `server/.env`.
- **Auth:** access + refresh token rotation (see `server/src/lib/tokens.ts`).
- **CORS:** backend allows only the origins listed in `CLIENT_ORIGINS`.

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

## Getting Started

### 1. Backend (`server/`)

```bash
cd server
cp .env.example .env        # then fill in the secret values
npm install
npm run dev                 # http://localhost:4000
```

Run the SQL in `server/db/` against your Supabase project:
`schema.sql`, `custom_auth.sql`, `migration_school_and_apply_modes.sql`, `seed_companies_and_jobs.sql`, `seed_school_and_apply_modes.sql`.

### 2. Web client (`client/`)

```bash
cd client
cp .env.example .env
npm install
node scripts/build-legacy.mjs   # compile the UI bundle
npm run dev                     # http://localhost:5173
```

The main production UI is in `client/legacy-src/` and is compiled ahead-of-time by `scripts/build-legacy.mjs`.

### 3. Mobile app (`mobile/`)

```bash
cd mobile
flutter pub get
flutter run --dart-define=API_URL=http://10.0.2.2:4000
```

---

## Progressive Web App (PWA)

The web app is fully PWA-enabled with push notifications, offline support, and install prompts. Users can install it from the browser on any device (no Play Store required).

**Features:**
- ✅ Install as app (iOS 16.4+, Android, desktop)
- ✅ Push notifications (via Web Push API + FCM backend)
- ✅ Offline support (app shell caching, network fallback for API calls)
- ✅ Home screen icon
- ✅ Standalone mode (no browser chrome)

**How it works:**
1. Service worker (`public/service-worker.js`) handles offline & caching
2. On login, the app requests notification permission and registers with Web Push
3. The server sends pushes via the same FCM backend to both Android and web clients
4. Users see an iOS-style install banner on compatible browsers

**Server setup (required for push):**

The server needs VAPID keys (Web Push standard). Default test keys are included, but for production:

```bash
# Generate new keys (one-time)
node -e "const wp=require('web-push'); console.log(JSON.stringify(wp.generateVAPIDKeys()))"
```

Set in Render environment:
- `VAPID_PUBLIC_KEY` — shared with clients
- `VAPID_PRIVATE_KEY` — kept secret on server
- `VAPID_SUBJECT` — email or URL for Push Service contact (default: noreply@aluhub.com)

---

## Android APK Distribution

The web app's left sidebar has a **Get the Android app** link that hits
`GET /api/download/android` on the server, which 302-redirects to the
latest release APK on GitHub Releases. The CI workflow
`.github/workflows/build-android-apk.yml` publishes the raw `.apk` as an
asset on the `android-latest` release tag on every push to `main`, so the
download URL is stable across builds and the file is **not** zipped (unlike
Actions artifacts, which GitHub auto-wraps in a zip).

### Reducing the Play Protect "scan this app" warning

A debug-signed APK trips Play Protect hard. To sign release builds with a
real upload keystore (and dramatically reduce the warning), generate a
keystore once and add four secrets to the GitHub repo.

```bash
# Generate the keystore (one-time, locally — keep the file safe!)
keytool -genkeypair -v \
  -keystore aluhub-release.keystore \
  -alias aluhub \
  -keyalg RSA -keysize 2048 -validity 10000

# Base64-encode for the GitHub secret
base64 -w 0 aluhub-release.keystore > keystore.b64
```

In GitHub → Settings → Secrets and variables → Actions, add:

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | contents of `keystore.b64` |
| `ANDROID_KEYSTORE_PASSWORD` | store password from `keytool` |
| `ANDROID_KEY_ALIAS` | `aluhub` (or whatever `-alias` you used) |
| `ANDROID_KEY_PASSWORD` | key password from `keytool` |

Without these the build still works — it falls back to debug signing and
prints a warning. With them, the release APK is properly signed.

> Even with proper signing, Play Protect may still warn the first few
> times an APK from a new developer key is sideloaded. The only way to
> remove the warning entirely is to distribute through the Google Play
> Store. The "Install anyway" button is intentionally subtle by Android
> design and cannot be hidden from inside the APK.

### Server env (optional)

- `ANDROID_APK_URL` — override the redirect target for `/api/download/android`.
  Defaults to the `android-latest` GitHub Release asset.
