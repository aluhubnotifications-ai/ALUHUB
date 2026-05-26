# ALUHub — agent instructions

## Project layout

- **`ALUHub.js`** (root) — main React/JSX app. Used during local dev
  via `index.html` (loads JSX through `@babel/standalone` in the
  browser).
- **`client/legacy-src/`** — **production source.** Cloudflare Pages
  serves the build of this directory. `client/scripts/build-legacy.mjs`
  uses esbuild to transpile `client/legacy-src/ALUHub.js` and
  `ALUHub_Auth.js` into `client/public/app/`, then Vite ships
  `client/dist/`. `.github/workflows/deploy-client.yml` triggers on
  any change under `client/**`. **When you fix UI bugs you almost
  always need to update BOTH the root file AND the legacy bundle**
  (or only the legacy bundle if the root is already correct), since
  the legacy bundle is what users actually see at
  `https://aluhub.pages.dev`. The two files have drifted before.
- **`client/src/`** — newer Vite/TypeScript scaffold, partially migrated.
- **`server/src/`** — Express + TypeScript backend.
- **`server/db/`** — SQL files; run manually in Supabase Dashboard.
- **`mobile/android-app/`** — Flutter Android app.

## Backend URLs

| Surface | URL |
|---|---|
| Frontend (Cloudflare Pages) | `https://aluhub.pages.dev` |
| Backend (Render) | `https://aluhub-server.onrender.com` |
| Local backend | `http://localhost:4000` |

## Custom auth (NOT Supabase Auth)

The project uses a custom auth table **`public.app_users`** — NOT
`auth.users`. See `server/db/custom_auth.sql`. Invariant from
`server/db/reconcile_profiles.sql`: `app_users.id = profiles.id`
for every signed-in user. Passwords are bcrypt (cost 12,
`server/src/lib/passwords.ts`).

Login: `POST /api/auth/login` with `{email, password}` → returns
`{accessToken, refreshToken, user}`. Refresh token is set as an
httpOnly cookie.

## Domain model — `job_listings`

Beyond the obvious fields:

| Column | Meaning |
|---|---|
| `apply_url` text | If set → external apply (open URL in new tab). If null → in-app native flow. |
| `posted_by_role` | `'company'` (default) or `'school'`. Drives UI badges. |
| `original_company_name` | When `posted_by_role='school'` and the school is forwarding an external employer's role (e.g. ALU posting a Microsoft job), this is the employer's name. NULL for the school's own jobs. |
| `original_company_logo_url` | Logo for the original employer (same condition as above). |
| `allowed_years` text[] | Empty `{}` = visible to all. Populated `{Year 3,Year 4}` = restricted to students whose `profiles.year` matches. Enforced client-side; can be lifted to RLS later. |
| `listing_type` text | `'Internship'` \| `'Full-time'` \| `'Part-time'` \| `'Fellowship'` etc. Read by frontend in 10+ places. |
| `type` text | Job category — `'Software Engineering'`, `'Data'`, `'Operations'`, etc. |

The `_mapJob` function in `ALUHub.js` (~line 3749) maps DB row → UI shape.

## Domain model — `profiles`

`user_type` is one of: `'student'`, `'company'`, `'school'`.

For year-restricted listings to work for students, the student's
`profiles.year` must be set to a string matching one of the values
used in `allowed_years` (convention: `'Year 1'`, `'Year 2'`,
`'Year 3'`, `'Year 4'`). Profile-edit UI lives in `ALUHub.js`.

## Demo accounts (passwords are `Demo2026!`, committed in seed files)

| Role | Email |
|---|---|
| Company | `andela@aluhub.com` |
| Company | `flutterwave@aluhub.com` |
| Company | `mpharma@aluhub.com` |
| Company | `oneacrefund@aluhub.com` |
| Company | `equitybank@aluhub.com` |
| School | `careers@alu.edu` (ALU Career Services) |

## SQL run order for a fresh DB

1. `server/db/schema.sql` — base tables
2. `server/db/custom_auth.sql` — switch to `app_users`
3. `server/db/migration_school_and_apply_modes.sql` — school role + apply_url + allowed_years
4. `server/db/seed_companies_and_jobs.sql` — 5 demo companies + 40 jobs + listing_type column
5. `server/db/seed_school_and_apply_modes.sql` — ALU school + 5 ALU jobs + apply_url on every company job
6. `server/db/backfill_apply_url_all_company_jobs.sql` (optional)
   — re-run anytime to fill `apply_url` for company-posted listings
   that were created before that convention

Every seed/migration is idempotent — safe to re-run.

## Frontend behavior — implemented in `ALUHub.js`

These rules are live in the code; preserve them when editing:

- **Apply button** — exactly ONE button labeled just `Apply` (no
  "Apply Now", no "Apply on Company Site"). The icon switches based
  on `job.apply_url`: `open_in_new` if a URL is set, `send` (or
  `rocket_launch` on JobCard) if not. On click, read `job.apply_url`
  first — if truthy, `window.open(job.apply_url, '_blank',
  'noopener,noreferrer')` and skip the native modal. Else → open the
  native `ApplyModal`. This rule applies to **every** Apply button in
  the app: JobCard, StudentDashboard quick-apply, JobDetailPage,
  CompanyPage inline-listing apply, plus the equivalents in
  `client/legacy-src/ALUHub.js`. Listings posted by a company are
  expected to carry an `apply_url`; only ALU school's own native
  roles use the in-app form.
- **Year filter** — `dbGetInternships` (~line 3716) filters out listings whose
  `allowed_years` does not include `__aluHubUser.profile.year`. Students with
  no `year` set, plus company / school users, see all listings.
- **Posted-by badge** — `_mapJob` exposes `posted_by_role`, `school_name`,
  `original_company_name`, `original_company_logo_url`. When
  `posted_by_role === 'school'` AND `original_company_name` is set, the
  card uses the original company's name + logo and shows a "Posted by
  [school]" line below the title plus a "School" tag. When the school
  posts its own role, the card uses the school's name + logo directly.
- **School treated like company** — `isCompany` checks in `JobCard`,
  `StudentDashboard`/`HomeDashboard`, `Internships`, `ProfilePage`, and
  the top-level page-state selector accept either `userType === 'company'`
  or `userType === 'school'`. The header chip says "School" for school
  users (instead of plan tier).
- **PostJob form** — accepts both companies and schools. Common fields plus:
  - **Apply mode toggle** (`in_app` | `external`). External requires a URL.
  - **`allowed_years` multi-select** (Year 1–4 chips).
  - **School-only** "this opportunity is from another company" section
    with a name input and a logo upload (Supabase Storage path
    `aluhub-media/external_logos/{uid}/{ts}.webp`).
  - Notifications go only to students whose `profiles.year` matches when
    `allowed_years` is restricted.
  - **NOTE:** The live posting form lives in `CompanyListingsPage`
    (~line 6300), invoked from the **Create Listing** modal in "My
    Listings". The standalone `PostJob` component (~line 6736) is
    legacy/dead code — both have the new fields but only the
    `CompanyListingsPage` one is reachable from the UI.

## AI features (Claude API)

`server/src/routes/ai.ts` exposes three endpoints all hitting
`api.anthropic.com/v1/messages`:

- `POST /api/ai/chat` — general chat
- `POST /api/ai/match` — score jobs for a student profile
- `POST /api/ai/company` — research a company

All currently use `claude-sonnet-4-6`. Latest models per
`@.../skills/claude-api/SKILL.md`: prefer `claude-opus-4-7` for chat
quality, `claude-sonnet-4-6` for cost-sensitive structured calls,
`claude-haiku-4-5` for highest-volume cheapest path.

Key: `ANTHROPIC_API_KEY` in `server/.env` (local) and Render dashboard
env vars (prod).

## Git workflow

- **Always push directly to `main`.** Do not ask which branch to target.
  Even when the current working branch is a `claude/…` feature branch,
  fast-forward `main` to it and push `origin main`. No PRs unless the
  user explicitly asks for one.
- Use `git push -u origin main` (with the standard retry-on-network-error
  policy from the session prompt).
