# ALUHub Internship Opportunities

## Project Name
**ALUHub Internship Portal — Centralized Discovery & AI Matching**

---

## Short Description
A platform that brings internship opportunities from multiple sources into one place for students, eliminating wasted time filtering across LinkedIn, company sites, and job boards. Schools post opportunities (native or third-party) with year-based restrictions. Students get AI-powered job matching and company research.

---

## Track
**Education & Career Services for African Leadership University (ALU)**

---

## Demo Video
[3–5 minute working prototype coming — shows student browsing internships, using AI Matcher, and applying]

---

## Live URL
- **Production:** `https://aluhub.pages.dev`
- **Backend API:** `https://aluhub-server.onrender.com`

---

## GitHub Repository
[Public GitHub link: `aluhubnotifications-ai/ALUHUB`]

---

## README

### Problem You Are Solving

**Students waste 10+ minutes filtering internship opportunities across scattered websites instead of applying.**

Right now, internship opportunities live on:
- LinkedIn
- Company websites
- Job boards
- Email announcements
- Partner sites

ALU students scroll through hundreds of roles, most not relevant to their year or goals. By the time they've filtered manually, they're tired and apply to fewer internships. **Time spent filtering = internships missed.**

---

### Solution

**ALUHub Internship Portal** — a centralized platform where:

1. **ALU Career Services** posts internships for ALU students (with year-based filtering)
2. **Other schools** can join and do the same for their students
3. **Students** see only relevant opportunities in one place
4. **Companies** either use our in-app apply form (fast) or link to their own application (flexible)

### What Makes It Different

✅ **One app** — stop checking 5 websites  
✅ **Pre-filtered** — only see internships for your year  
✅ **Two apply modes** — in-app quick form OR external company link  
✅ **AI job matching** — upload resume → get compatibility scores for each role  
✅ **AI company research** — understand what companies do before applying  
✅ **Scalable** — any school can post opportunities for their students  

---

### How Claude Is Used

#### 1. **Job Matching**
- Students upload resume + interests
- Claude reads each internship description against the student's profile
- Returns: match score (0–100%), skills gap analysis, why this role is/isn't a fit
- **Impact:** Students focus on roles where they have 70%+ fit, not spray-and-pray applications

#### 2. **Company Research**
- Student clicks on a company
- Claude pulls together: what they do, market position, hiring signals
- Returns: 1-paragraph summary + key facts
- **Impact:** Students walk into interviews prepared, increasing acceptance rates

#### 3. **Opportunity Filtering** (future)
- Claude reads `allowed_years` restrictions and student profile year
- Ensures year-restricted internships only show to eligible students
- Prevents cross-year visibility mistakes

---

### Impact You Are Aiming For

#### For Students
- **Reduce time wasted filtering:** from 10 min → 1 min per session
- **Increase applications:** students apply to more roles when discovery is fast
- **Better matching:** AI scoring prevents applications to poor-fit roles (saves rejection heartache)
- **Interview prep:** company research helps students walk in ready

#### For Schools
- **Centralized opportunity posting:** one place to curate and share internships
- **Year-based control:** restrict Year 3 roles to Year 3 students, ensure fairness
- **Third-party posting:** can forward opportunities from partner companies without manual coordination
- **Student engagement:** trackable apply flow, better data on where students get internships

#### For Companies
- **Flexible apply:** use our form (quick) or link to your site (full control)
- **Targeted reach:** only shown to students in their relevant year
- **High-intent applicants:** students using AI matching are pre-vetted, more likely to succeed in role

---

### How It Works

**For Students:**
1. Log in, set your year (Year 1–4)
2. Browse internships — only see your year + any open listings
3. Click "Apply" → either submit our form (native) or open company's site (external)
4. Optional: Use AI Matcher to see job fit scores

**For Schools:**
1. Post internship (own or partner company)
2. Choose apply mode: in-app or external link
3. Set year restrictions (all years? Year 3+ only?)
4. If partner company, upload company name + logo
5. Students in matching years see it immediately

**For Companies:**
1. Send opportunity to school
2. School decides: post as native (we handle applies) or as external link
3. Applications arrive via our form or your site, depending on mode
4. School notifies you of applicants

---

### The Result

**Before:** Students spend 30 minutes/week filtering, apply to 2–3 internships, miss good fits  
**After:** Students spend 5 minutes/week discovering, apply to 8–10 internships, AI helps them pick good matches

Schools gain a **controlled, fair way to distribute opportunities.** Companies get **pre-vetted, year-appropriate applicants.** Students get **their time back.**
