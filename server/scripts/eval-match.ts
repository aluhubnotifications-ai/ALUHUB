/**
 * Match-scoring calibration harness.
 * ────────────────────────────────────────────────────────────────────
 * Hand-scored student×job pairs + a report measuring whether the scorer
 * is honest (not everything inflated to "Good"). Run it before/after a
 * scoring change to see if the distribution actually moved.
 *
 * Deterministic only (Layer 1 + completeness cap, delta = 0). Free, no
 * network, runnable anywhere:
 *     npx tsx server/scripts/eval-match.ts
 *
 * Full pipeline (adds the live Claude Layer-2 delta). Needs a real key
 * and spends tokens — one Claude call per pair:
 *     ANTHROPIC_API_KEY=sk-... npx tsx server/scripts/eval-match.ts --live
 *
 * Expected bands below are HAND-JUDGED — the ground truth. Edit/extend
 * the FIXTURES as the product's notion of a good match evolves.
 */

// The route module validates Supabase/JWT env at import time. The
// deterministic path never touches the DB, so stub those vars before a
// dynamic import. --live additionally needs a real ANTHROPIC_API_KEY.
if (!process.env.SUPABASE_URL) process.env.SUPABASE_URL = 'http://localhost:54321'; // must parse as a URL
for (const k of ['SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_JWT_SECRET']) {
  if (!process.env[k]) process.env[k] = 'eval-stub';
}

const LIVE = process.argv.includes('--live');

// Imported from the SAME source the app runs — no duplicated scoring
// logic, so the eval can never silently drift from production.
const { scoreLayer1, completenessCap, scoreToFit, callClaudeMatch } =
  await import('../src/routes/ai.js');

// ── Bands ───────────────────────────────────────────────────────────
const BANDS = ['weak', 'possible', 'good', 'strong'] as const;
type Band = (typeof BANDS)[number];
const bandIdx = (b: string) => BANDS.indexOf(b as Band);

// ── Fixtures ────────────────────────────────────────────────────────
type Profile = Record<string, unknown>;
interface Job { id: string; title: string; description?: string; type?: string; location?: string; tags?: string[] }

const STUDENTS: Record<string, Profile> = {
  swe: {
    major: 'Computer Science', year: 'Year 3',
    bio: 'I build web apps with React and Node. Shipped two student projects and a hackathon-winning dashboard.',
    desired_roles: ['Software Engineer', 'Frontend Engineer'],
    preferred_industries: ['Technology'],
    skills: ['React', 'TypeScript', 'Node.js', 'Python', 'SQL'],
    location_pref: 'Kigali, Remote',
  },
  data: {
    major: 'Data Science', year: 'Year 4',
    bio: 'Focused on analytics and ML. Built churn models and dashboards from real datasets.',
    desired_roles: ['Data Analyst', 'Data Scientist'],
    preferred_industries: ['Finance', 'Technology'],
    skills: ['Python', 'SQL', 'Pandas', 'Machine Learning', 'Statistics'],
    location_pref: 'Remote',
  },
  // Deliberately thin → exercises the completeness cap.
  sparse: {
    year: 'Year 2',
    skills: ['Python'],
  },
  switcher: {
    major: 'Business Administration', year: 'Year 4',
    bio: 'Transitioning from business into product. Led a student org and ran roadmap planning for an event app.',
    desired_roles: ['Product Manager'],
    preferred_industries: ['Technology'],
    skills: ['Excel', 'Communication', 'Project Management'],
    location_pref: 'Lagos',
  },
};

const JOBS: Record<string, Job> = {
  frontend: { id: 'frontend', title: 'Frontend Engineer Intern', type: 'Software Engineering', location: 'Remote', tags: ['React', 'TypeScript', 'CSS'], description: 'Build user-facing features in a React + TypeScript codebase.' },
  backend:  { id: 'backend',  title: 'Backend Engineer',         type: 'Software Engineering', location: 'Kigali', tags: ['Node.js', 'Python', 'SQL', 'AWS'], description: 'Design APIs and services in Node and Python on AWS.' },
  dataAnalyst: { id: 'dataAnalyst', title: 'Data Analyst Intern', type: 'Data', location: 'Remote', tags: ['SQL', 'Python', 'Pandas', 'Tableau'], description: 'Turn raw data into dashboards and insights for the business.' },
  mlEng:    { id: 'mlEng',    title: 'Machine Learning Engineer', type: 'Data', location: 'Nairobi', tags: ['Python', 'Machine Learning', 'TensorFlow'], description: 'Train and deploy ML models in production.' },
  salesRep: { id: 'salesRep', title: 'Sales Representative',     type: 'Sales', location: 'Lagos', tags: ['Communication', 'CRM'], description: 'Own a pipeline of prospects and close deals.' },
  pmRole:   { id: 'pmRole',   title: 'Associate Product Manager', type: 'Product', location: 'Lagos', tags: ['Product Management', 'Analytics', 'Roadmap'], description: 'Define roadmap, write specs, and work with engineering.' },
  mechEng:  { id: 'mechEng',  title: 'Mechanical Engineer',      type: 'Engineering', location: 'Accra', tags: ['CAD', 'SolidWorks', 'Manufacturing'], description: 'Design mechanical assemblies and oversee manufacturing.' },
};

interface Pair { student: keyof typeof STUDENTS; job: keyof typeof JOBS; expected: Band; note: string }

const FIXTURES: Pair[] = [
  { student: 'swe',      job: 'frontend',    expected: 'strong',   note: 'core stack + role match' },
  { student: 'swe',      job: 'backend',     expected: 'strong',   note: 'Node/Python/SQL + Kigali' },
  { student: 'swe',      job: 'dataAnalyst', expected: 'possible', note: 'Python/SQL overlap, wrong domain' },
  { student: 'swe',      job: 'salesRep',    expected: 'weak',     note: 'no real overlap' },
  { student: 'swe',      job: 'mechEng',     expected: 'weak',     note: 'unrelated discipline' },
  { student: 'data',     job: 'dataAnalyst', expected: 'strong',   note: 'skills + role + industry' },
  { student: 'data',     job: 'mlEng',       expected: 'good',     note: 'Python/ML, more senior' },
  { student: 'data',     job: 'backend',     expected: 'possible', note: 'Python/SQL only, not their role' },
  { student: 'data',     job: 'salesRep',    expected: 'weak',     note: 'no overlap' },
  { student: 'sparse',   job: 'dataAnalyst', expected: 'possible', note: 'one signal + thin profile → capped' },
  { student: 'switcher', job: 'pmRole',      expected: 'good',     note: 'role + industry + Lagos' },
  { student: 'switcher', job: 'salesRep',    expected: 'possible', note: 'soft-skill + location only' },
];

// ── Run ─────────────────────────────────────────────────────────────
interface Row { pair: Pair; base: number; cap: number; score: number; band: Band }

async function scorePair(p: Pair): Promise<Row> {
  const student = STUDENTS[p.student];
  const job = JOBS[p.job];
  const l1 = scoreLayer1(student, job);
  const cap = completenessCap(l1.completeness);

  let delta = 0;
  if (LIVE) {
    const { matches } = await callClaudeMatch(student, [job]);
    // callClaudeMatch already applies base+delta+cap; recover the score directly.
    const score = matches[0]?.score ?? Math.min(cap, l1.base);
    return { pair: p, base: l1.base, cap, score, band: scoreToFit(score) };
  }
  const score = Math.min(cap, Math.max(20, Math.min(99, l1.base + delta)));
  return { pair: p, base: l1.base, cap, score, band: scoreToFit(score) };
}

function pad(s: string | number, n: number) { return String(s).padEnd(n); }

async function main() {
  const rows: Row[] = [];
  for (const p of FIXTURES) rows.push(await scorePair(p)); // serial → gentle on the API in --live

  console.log(`\nMatch-scoring calibration — ${LIVE ? 'LIVE (Layer1 + Claude delta + cap)' : 'deterministic (Layer1 + cap, delta=0)'}\n`);
  console.log(
    pad('student', 10) + pad('job', 13) + pad('expect', 9) +
    pad('base', 6) + pad('cap', 5) + pad('score', 7) + pad('got', 9) + 'Δband',
  );
  console.log('─'.repeat(70));

  let exact = 0, within1 = 0, signedErr = 0, strong = 0, goodPlus = 0;
  for (const r of rows) {
    const d = bandIdx(r.band) - bandIdx(r.pair.expected);
    if (d === 0) exact++;
    if (Math.abs(d) <= 1) within1++;
    signedErr += d;
    if (r.score >= 85) strong++;
    if (r.score >= 70) goodPlus++;
    const mark = d === 0 ? 'ok' : d > 0 ? `+${d} HIGH` : `${d} low`;
    console.log(
      pad(r.pair.student, 10) + pad(r.pair.job, 13) + pad(r.pair.expected, 9) +
      pad(r.base, 6) + pad(r.cap, 5) + pad(r.score, 7) + pad(r.band, 9) + mark,
    );
  }

  const n = rows.length;
  const scores = rows.map((r) => r.score).sort((a, b) => a - b);
  const mean = Math.round((scores.reduce((s, x) => s + x, 0) / n) * 10) / 10;
  const median = scores[Math.floor(n / 2)];
  const pct = (k: number) => `${Math.round((k / n) * 100)}%`;

  console.log('─'.repeat(70));
  console.log(`\nCalibration (n=${n})`);
  console.log(`  mean score        ${mean}`);
  console.log(`  median score      ${median}`);
  console.log(`  % "strong" (≥85)  ${pct(strong)}   (${strong}/${n})`);
  console.log(`  % "good+" (≥70)   ${pct(goodPlus)}   (${goodPlus}/${n})`);
  console.log(`  exact band match  ${pct(exact)}   (${exact}/${n})`);
  console.log(`  within ±1 band    ${pct(within1)}   (${within1}/${n})`);
  console.log(`  mean band error   ${(signedErr / n).toFixed(2)}   (>0 = inflated, <0 = harsh)`);

  // Three-way verdict. The redesign's goal was to stop inflation, so a
  // positive mean error / strong-heavy set is the failure we care about most.
  // A strongly negative error is also worth surfacing — in deterministic mode
  // it's expected (deltas not applied); in --live mode it means Claude isn't
  // lifting the genuinely-good pairs and the prompt needs another look.
  const err = signedErr / n;
  if (err > 0.25 || strong / n > 0.5) {
    console.log(`\n  ⚠ INFLATION: scores skew high vs the hand-scored set.`);
  } else if (err < -0.5) {
    console.log(`\n  ${LIVE ? '⚠ HARSH: Claude deltas are not lifting good pairs — revisit the prompt.'
                            : '· harsh, as expected for delta=0 — run with --live to apply Claude deltas.'}`);
  } else {
    console.log(`\n  ✓ distribution looks honest vs the hand-scored set.`);
  }
  console.log();
}

await main();
