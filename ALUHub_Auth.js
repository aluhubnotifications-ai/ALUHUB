// ══════════════════════════════════════════════════════════════════
//  ALU HUB — AUTH SYSTEM  (ALUHub_Auth.js)
//  Supabase backend · MTN MoMo · Airtel Money · Visa/Debit
//
//  HOW TO USE:
//  1. Create a Supabase project at supabase.com
//  2. Replace SUPABASE_URL and SUPABASE_ANON_KEY below
//  3. Run the SQL schema at the bottom of this file in Supabase SQL editor
//  4. Add ALUHub_Auth.css before ALUHub.css in your HTML
//  5. Replace the ALUHub.js <script> tag with this file
//     (or include both and this file second — it wraps the App)
//
//  PAYMENT FLOW:
//  - Students: $4/mo via MoMo or card → Supabase sets user.plan = 'pro'
//  - Companies: $25–$150 via MoMo or card → creates company listing
//  - All payments go through Flutterwave (rwf + usd support)
// ══════════════════════════════════════════════════════════════════

const { useState, useEffect, useRef, useCallback } = React;

// ── CONFIG ──────────────────────────────────────────────────────
const SUPABASE_URL   = 'https://dkvrvnufajnwrrpvgsck.supabase.co';
const SUPABASE_ANON  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrdnJ2bnVmYWpud3JycHZnc2NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxOTkyNjksImV4cCI6MjA5Mjc3NTI2OX0.BqAdsWxfgr0eCP9Imf9qV58W6Xx9lYFt6TGJ1EUj2HQ';
const FLW_PUBLIC_KEY = 'FLWPUBK_TEST-XXXX';                   // ← replace with Flutterwave key
const API_URL        = (window.__ALUHUB_ENV && window.__ALUHUB_ENV.API_URL) || 'http://localhost:4000';

// Email-domain restriction removed: any valid email may sign up.
// Kept as an empty array so isStudentEmail still exists for any UI
// that calls it (it now always returns true).
const STUDENT_DOMAINS = [];

// ── BACKEND AUTH (custom, replaces Supabase Auth) ───────────────
// We talk to our own Express backend for register/login/logout. It
// returns a JWT signed with the Supabase project's JWT secret, so the
// Supabase JS client can use it for PostgREST queries and RLS keeps
// working untouched.

const TOKEN_KEY = 'aluhub_access_token';
const USER_KEY  = 'aluhub_user';

function getAccessToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
function setAccessToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else       localStorage.removeItem(TOKEN_KEY);
  } catch {}
  scheduleTokenRefresh(token);
}

// ── PROACTIVE ACCESS TOKEN REFRESH ──────────────────────────────
// The access token has a short TTL (1h by default). Without this,
// PostgREST starts answering 401 and Realtime channels TIMED_OUT
// after the token expires, which silently breaks DM inserts, etc.
let _refreshTimer = null;

function decodeJwtExpMs(token) {
  if (!token) return 0;
  try {
    const payload = token.split('.')[1];
    if (!payload) return 0;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const exp = JSON.parse(json).exp;
    return typeof exp === 'number' ? exp * 1000 : 0;
  } catch { return 0; }
}

function scheduleTokenRefresh(token) {
  if (_refreshTimer) { clearTimeout(_refreshTimer); _refreshTimer = null; }
  if (!token) return;
  const expMs = decodeJwtExpMs(token);
  if (!expMs) return;
  // Refresh 60s before expiry, with a 10s floor so a near-expired
  // token still gets a refresh attempt instead of being skipped.
  const delay = Math.max(10_000, expMs - Date.now() - 60_000);
  _refreshTimer = setTimeout(() => { refreshSession().catch(() => {}); }, delay);
}

// If the tab was backgrounded long enough for the token to expire,
// refresh on the way back in so the first user action doesn't 401.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    const token = getAccessToken();
    if (!token) return;
    const expMs = decodeJwtExpMs(token);
    if (expMs && expMs - Date.now() < 60_000) {
      refreshSession().catch(() => {});
    }
  });
}
function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function setStoredUser(user) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else      localStorage.removeItem(USER_KEY);
  } catch {}
}

async function apiAuth(path, body) {
  const res = await fetch(`${API_URL}/api/auth${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok) return { error: { message: data.error || `Request failed (${res.status})` } };
  return { data };
}

// ── SUPABASE CLIENT ─────────────────────────────────────────────
// We deliberately do NOT call auth.setSession with our custom JWT —
// setSession triggers a GET /auth/v1/user against gotrue, which 403s
// because our JWT was not minted by gotrue. Instead, we inject the
// Authorization header onto each sub-client. PostgREST verifies the
// JWT with the project's JWT secret, so RLS works as normal.
//
// We share the client through window._sbMain so ALUHub.js (which has
// its own getSB) uses the same instance — silences the "Multiple
// GoTrueClient instances" warning and keeps realtime auth in sync.
let _sb = null;
function sb() {
  if (_sb) return _sb;
  if (window._sbMain) { _sb = window._sbMain; }
  else {
    if (!window.supabase) { console.error('Supabase SDK not loaded'); return null; }
    _sb = window._sbMain = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });
  }
  const token = getAccessToken();
  if (token) applyAccessTokenToSupabase(token);
  return _sb;
}

function applyAccessTokenToSupabase(token) {
  if (!_sb) return;
  const auth = `Bearer ${token}`;
  if (_sb.rest && _sb.rest.headers)      _sb.rest.headers['Authorization'] = auth;
  if (_sb.storage && _sb.storage.headers) _sb.storage.headers['Authorization'] = auth;
  if (_sb.functions && _sb.functions.headers) _sb.functions.headers['Authorization'] = auth;
  if (_sb.realtime && typeof _sb.realtime.setAuth === 'function') {
    _sb.realtime.setAuth(token);
  }
}

// ── AUTH HELPERS ─────────────────────────────────────────────────
async function signUp(email, password, meta) {
  const { data, error } = await apiAuth('/register', { email, password, metadata: meta });
  if (error) return { error };
  setAccessToken(data.accessToken);
  setStoredUser(data.user);
  sb(); applyAccessTokenToSupabase(data.accessToken);
  return { data: { user: data.user, session: { access_token: data.accessToken } } };
}

async function signIn(email, password) {
  const { data, error } = await apiAuth('/login', { email, password });
  if (error) return { error };
  setAccessToken(data.accessToken);
  setStoredUser(data.user);
  sb(); applyAccessTokenToSupabase(data.accessToken);
  return { data: { user: data.user, session: { access_token: data.accessToken } } };
}

async function signOut() {
  await apiAuth('/logout', {});
  setAccessToken(null);
  setStoredUser(null);
  if (_sb) {
    if (_sb.rest && _sb.rest.headers)           delete _sb.rest.headers['Authorization'];
    if (_sb.storage && _sb.storage.headers)     delete _sb.storage.headers['Authorization'];
    if (_sb.functions && _sb.functions.headers) delete _sb.functions.headers['Authorization'];
    if (_sb.realtime && typeof _sb.realtime.setAuth === 'function') _sb.realtime.setAuth(null);
  }
}

async function refreshSession() {
  const { data, error } = await apiAuth('/refresh', {});
  if (error) {
    setAccessToken(null);
    setStoredUser(null);
    return null;
  }
  setAccessToken(data.accessToken);
  setStoredUser(data.user);
  sb(); applyAccessTokenToSupabase(data.accessToken);
  return { access_token: data.accessToken, user: data.user };
}
// Exposed so ALUHub.js (separate <script> in the page) can ask for a
// fresh access token after a 401 from Supabase REST.
window.refreshSession = refreshSession;

async function getSession() {
  const token = getAccessToken();
  if (!token) {
    // Try the refresh cookie — survives reloads even without a stored token.
    return await refreshSession();
  }
  // If the cached token is already expired (or within 60s of it), do a
  // fresh /refresh now rather than handing PostgREST a dead JWT.
  const expMs = decodeJwtExpMs(token);
  if (expMs && expMs - Date.now() < 60_000) {
    return await refreshSession();
  }
  sb(); applyAccessTokenToSupabase(token);
  scheduleTokenRefresh(token);
  const user = getStoredUser();
  return { access_token: token, user };
}

async function verifyEmail(token) {
  return apiAuth('/verify-email', { token });
}

async function resendVerificationEmail(email) {
  return apiAuth('/resend-verification', { email });
}

async function requestPasswordReset(email) {
  return apiAuth('/request-password-reset', { email });
}

async function resetPassword(token, password) {
  return apiAuth('/reset-password', { token, password });
}

async function upsertProfile(userId, profile) {
  const client = sb();
  if (!client) return;
  await client.from('profiles').upsert({ id: userId, ...profile });
}

async function getProfile(userId) {
  const client = sb();
  if (!client) return null;
  const { data } = await client.from('profiles').select('*').eq('id', userId).single();
  return data;
}

// ── VALIDATION ───────────────────────────────────────────────────
function isStudentEmail(email) {
  if (STUDENT_DOMAINS.length === 0) return true;
  const domain = email.split('@')[1]?.toLowerCase();
  return STUDENT_DOMAINS.includes(domain);
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
  return /^[0-9]{9,10}$/.test(phone.replace(/\s/g, ''));
}

// ── EMAIL VERIFY / PASSWORD RESET BOOTSTRAP ─────────────────────
// Handles ?verify_token=... and ?reset_token=... in the URL so the
// links in our transactional emails land cleanly back on the SPA.
(async function consumeAuthQueryParams() {
  try {
    const params = new URLSearchParams(window.location.search);
    const verifyToken = params.get('verify_token');
    if (verifyToken) {
      const { error } = await verifyEmail(verifyToken);
      params.delete('verify_token');
      const newQs = params.toString();
      history.replaceState({}, '', window.location.pathname + (newQs ? `?${newQs}` : ''));
      window.__ALUHUB_VERIFY_RESULT = error ? { ok: false, message: error.message } : { ok: true };
    }
  } catch (e) {
    console.warn('[auth] verify bootstrap failed:', e);
  }
})();

// ── FLUTTERWAVE PAYMENT ──────────────────────────────────────────
function initFlutterwaveMoMo({ amount, currency, phone, network, name, email, planName, onSuccess, onClose }) {
  if (!window.FlutterwaveCheckout) {
    alert('Payment gateway is loading. Please refresh the page and try again.');
    onClose && onClose();
    return;
  }
  FlutterwaveCheckout({
    public_key: FLW_PUBLIC_KEY,
    tx_ref: 'ALUHUB-' + Date.now(),
    amount,
    currency: currency || 'RWF',
    payment_options: 'mobilemoneyfrancophone',
    customer: { email, name, phone_number: '+250' + phone },
    customizations: {
      title: 'ALU Hub',
      description: planName,
      logo: 'https://aluhub.vercel.app/logo.png',
    },
    callback: (response) => { onSuccess(response); },
    onclose: onClose,
  });
}

function initFlutterwaveCard({ amount, currency, name, email, planName, onSuccess, onClose }) {
  if (!window.FlutterwaveCheckout) {
    alert('Payment gateway is loading. Please refresh the page and try again.');
    onClose && onClose();
    return;
  }
  FlutterwaveCheckout({
    public_key: FLW_PUBLIC_KEY,
    tx_ref: 'ALUHUB-' + Date.now(),
    amount,
    currency: currency || 'USD',
    payment_options: 'card',
    customer: { email, name },
    customizations: {
      title: 'ALU Hub',
      description: planName,
      logo: 'https://aluhub.vercel.app/logo.png',
    },
    callback: (response) => { onSuccess(response); },
    onclose: onClose,
  });
}

// ── TOAST ─────────────────────────────────────────────────────────
function toast(msg) {
  const el = document.getElementById('toast');
  const txt = document.getElementById('toast-text');
  if (!el || !txt) return;
  txt.textContent = msg;
  el.classList.add('on');
  setTimeout(() => el.classList.remove('on'), 3200);
}

// ══════════════════════════════════════════════════════════════════
//  AUTH SCREEN COMPONENTS
// ══════════════════════════════════════════════════════════════════

// ── STEP INDICATOR ────────────────────────────────────────────────
function StepDots({ current, total }) {
  return (
    <div className="auth-steps">
      {Array.from({ length: total }, (_, i) => (
        <React.Fragment key={i}>
          <div className={`auth-step-dot ${i < current ? 'done' : i === current ? 'current' : 'future'}`}>
            {i < current ? '✓' : i + 1}
          </div>
          {i < total - 1 && <div className={`auth-step-line ${i < current ? 'done' : ''}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── RIGHT PANEL ───────────────────────────────────────────────────
function AuthRight({ userType }) {
  const features = userType === 'company' ? [
    { icon: '💼', title: 'Post internships directly', desc: 'Reach 500+ verified ALU & CMU-Africa students' },
    { icon: '🎯', title: 'AI-matched candidates', desc: 'Students\' CVs are ranked by fit to your listing' },
    { icon: '📊', title: 'Track applications', desc: 'See who applied, shortlist, and message candidates' },
    { icon: '🚀', title: 'Company profile page', desc: 'Branded listing with your jobs and culture' },
  ] : [
    { icon: '💼', title: 'Internship board', desc: '14+ verified Kigali internships with AI CV matching' },
    { icon: '🎓', title: 'Skills marketplace', desc: 'Book 1-on-1 sessions with top students from $5' },
    { icon: '🗺', title: 'Kigali survival guide', desc: 'Housing, motos, SIM cards, food — all you need' },
    { icon: '🤝', title: 'Housing board', desc: 'Find or offer temporary housing in Kigali' },
  ];

  return (
    <div className="auth-right-content auth-anim">
      <div className="auth-right-badge">
        🔥 {userType === 'company' ? 'Hiring on ALU Hub' : 'Student Platform'}
      </div>
      <div className="auth-right-heading">
        {userType === 'company'
          ? <><span>Hire Africa's</span><br />next generation</>
          : <>Your campus.<br /><span>Your advantage.</span></>
        }
      </div>
      <div className="auth-features">
        {features.map((f, i) => (
          <div className="auth-feature auth-anim" key={i} style={{ animationDelay: (i * 0.08) + 's' }}>
            <div className="auth-feature-icon">{f.icon}</div>
            <div>
              <div className="auth-feature-title">{f.title}</div>
              <div className="auth-feature-desc">{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="auth-social-proof">
        <div className="proof-avatars">
          {['#0A2E5C', '#1a4a80', '#3a7bd5', '#0d3572'].map((c, i) => (
            <div key={i} className="proof-av" style={{ background: c }}>
              {['JC', 'AK', 'SL', 'MO'][i]}
            </div>
          ))}
        </div>
        <div className="proof-text">
          <strong>200+ students</strong> joining for May 2026 intake
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  STEP 1: USER TYPE SELECTION
// ══════════════════════════════════════════════════════════════════
function StepUserType({ onSelect }) {
  const [selected, setSelected] = useState(null);

  return (
    <div className="auth-shell">
      <div className="auth-left">
        <div className="auth-logo">
          <div className="auth-logo-mark">A</div>
          <div className="auth-logo-text">ALU<span>Hub</span></div>
        </div>

        <div className="auth-form-wrap">
          <StepDots current={0} total={3} />
          <div className="auth-eyebrow">Welcome</div>
          <div className="auth-heading auth-anim">Who are you?</div>
          <div className="auth-sub auth-anim auth-anim-d1">
            Your account type determines what you can do on ALU Hub.
          </div>

          <div className="user-type-grid auth-anim auth-anim-d2">
            <div
              className={`user-type-card ${selected === 'student' ? 'selected' : ''}`}
              onClick={() => setSelected('student')}
            >
              <span className="user-type-icon">🎓</span>
              <div className="user-type-title">Student</div>
              <div className="user-type-desc">ALU or CMU-Africa student looking for internships, skills & resources</div>
            </div>
            <div
              className={`user-type-card ${selected === 'company' ? 'selected' : ''}`}
              onClick={() => setSelected('company')}
            >
              <span className="user-type-icon">🏢</span>
              <div className="user-type-title">Company</div>
              <div className="user-type-desc">Organisation looking to post internships and hire top African talent</div>
            </div>
          </div>

          {selected && (
            <div style={{ marginTop: 4, padding: '10px 14px', borderRadius: 8, fontSize: 12.5, color: 'var(--text2)', background: 'rgba(79,70,229,.06)', border: '1px solid rgba(79,70,229,.12)' }}>
              {selected === 'student'
                ? '🎓 Any email works · $4/mo after signup.'
                : '💳 Company accounts require a paid plan ($25–$150/mo) to post internships.'}
            </div>
          )}

          <button
            className="auth-btn auth-btn-primary"
            disabled={!selected}
            onClick={() => onSelect(selected)}
            style={{ marginTop: 18 }}
          >
            Continue as {selected === 'student' ? 'Student' : selected === 'company' ? 'Company' : '…'} →
          </button>

          <div className="auth-switch" style={{ marginTop: 16 }}>
            Already have an account? <span className="link" onClick={() => onSelect('login')}>Sign in</span>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <AuthRight userType={selected || 'student'} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  STEP 2a: STUDENT SIGNUP
// ══════════════════════════════════════════════════════════════════
function StepStudentSignup({ onDone, onBack }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', school: 'ALU', major: '', year: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: null })); }

  async function submit() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!validateEmail(form.email)) errs.email = 'Enter a valid email address';
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (!form.major) errs.major = 'Select your program';
    if (!form.year) errs.year = 'Select your year';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    const { data, error } = await signUp(form.email, form.password, {
      full_name: form.name,
      user_type: 'student',
      school: form.school,
      major: form.major,
      year: form.year,
    });
    if (error) { setErrors({ email: error.message }); setLoading(false); return; }
    if (data?.user) {
      await upsertProfile(data.user.id, {
        full_name: form.name,
        user_type: 'student',
        school: form.school,
        major: form.major,
        year: form.year,
        plan: 'pending_payment',
      });
    }
    setLoading(false);
    onDone({ user: data?.user, form, userType: 'student' });
  }

  return (
    <div className="auth-shell">
      <div className="auth-left">
        <div className="auth-logo">
          <div className="auth-logo-mark">A</div>
          <div className="auth-logo-text">ALU<span>Hub</span></div>
        </div>

        <div className="auth-form-wrap">
          <StepDots current={1} total={3} />
          <div className="auth-eyebrow">Student Account</div>
          <div className="auth-heading auth-anim">Create your profile</div>
          <div className="auth-sub auth-anim auth-anim-d1">
            You'll need your institutional email to verify enrollment.
          </div>

          <div className="auth-field auth-anim auth-anim-d1">
            <label className="auth-label">Full name</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">👤</span>
              <input className={`auth-input ${errors.name ? 'err' : ''}`} placeholder="Jean Chretien Horugavye"
                value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            {errors.name && <div className="auth-err">⚠ {errors.name}</div>}
          </div>

          <div className="auth-field auth-anim auth-anim-d1">
            <label className="auth-label">Email</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">📧</span>
              <input className={`auth-input ${errors.email ? 'err' : ''}`}
                placeholder="you@example.com" type="email"
                value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            {errors.email && <div className="auth-err">⚠ {errors.email}</div>}
          </div>

          <div className="auth-field auth-anim auth-anim-d2">
            <label className="auth-label">Password</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">🔒</span>
              <input className={`auth-input ${errors.password ? 'err' : ''}`}
                type={showPwd ? 'text' : 'password'} placeholder="Min 8 characters"
                value={form.password} onChange={e => set('password', e.target.value)} />
              <button className="auth-pwd-toggle" type="button" onClick={() => setShowPwd(s => !s)}>
                {showPwd ? '🙈' : '👁'}
              </button>
            </div>
            {errors.password && <div className="auth-err">⚠ {errors.password}</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }} className="auth-anim auth-anim-d2">
            <div className="auth-field">
              <label className="auth-label">School</label>
              <select className="auth-input" value={form.school} onChange={e => set('school', e.target.value)}>
                <option value="ALU">ALU Rwanda</option>
                <option value="CMU-Africa">CMU-Africa</option>
              </select>
            </div>
            <div className="auth-field">
              <label className="auth-label">Year</label>
              <select className={`auth-input ${errors.year ? 'err' : ''}`} value={form.year} onChange={e => set('year', e.target.value)}>
                <option value="">Year…</option>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
              </select>
              {errors.year && <div className="auth-err">⚠ {errors.year}</div>}
            </div>
          </div>

          <div className="auth-field auth-anim auth-anim-d3">
            <label className="auth-label">Program / Major</label>
            <select className={`auth-input ${errors.major ? 'err' : ''}`} value={form.major} onChange={e => set('major', e.target.value)}>
              <option value="">Select program…</option>
              <option>Business & Entrepreneurship</option>
              <option>Computer Science</option>
              <option>Global Challenges</option>
              <option>Electrical & Computer Engineering</option>
              <option>Information Systems</option>
              <option>Software Engineering</option>
              <option>Other</option>
            </select>
            {errors.major && <div className="auth-err">⚠ {errors.major}</div>}
          </div>

          <button className="auth-btn auth-btn-primary" onClick={submit} disabled={loading}>
            {loading ? '⏳ Creating account…' : 'Create account →'}
          </button>

          <div className="auth-switch">
            <span className="link" onClick={onBack}>← Back</span>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <AuthRight userType="student" />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  STEP 2b: COMPANY SIGNUP
// ══════════════════════════════════════════════════════════════════
function StepCompanySignup({ onDone, onBack }) {
  const [form, setForm] = useState({ name: '', company: '', email: '', password: '', industry: '', size: '', plan: 'standard' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const plans = [
    { id: 'basic', icon: '📋', name: 'Basic', price: '$25', priceNum: 25, feat: '1 job posting · Company page' },
    { id: 'standard', icon: '⭐', name: 'Standard', price: '$75', priceNum: 75, feat: '5 postings · Featured listing' },
    { id: 'premium', icon: '💎', name: 'Premium', price: '$150', priceNum: 150, feat: 'Unlimited · Homepage spot' },
  ];

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: null })); }

  async function submit() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Contact name required';
    if (!form.company.trim()) errs.company = 'Company name required';
    if (!validateEmail(form.email)) errs.email = 'Enter a valid email';
    if (form.password.length < 8) errs.password = 'Min 8 characters';
    if (!form.industry) errs.industry = 'Select industry';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    const { data, error } = await signUp(form.email, form.password, {
      full_name: form.name,
      company_name: form.company,
      user_type: 'company',
      plan: form.plan,
    });
    if (error) { setErrors({ email: error.message }); setLoading(false); return; }
    if (data?.user) {
      await upsertProfile(data.user.id, {
        full_name: form.name,
        company_name: form.company,
        user_type: 'company',
        industry: form.industry,
        company_size: form.size,
        plan: 'pending_payment',
      });
    }
    setLoading(false);
    const selectedPlan = plans.find(p => p.id === form.plan);
    onDone({ user: data?.user, form, userType: 'company', plan: selectedPlan });
  }

  return (
    <div className="auth-shell">
      <div className="auth-left" style={{ overflowY: 'auto' }}>
        <div className="auth-logo">
          <div className="auth-logo-mark">A</div>
          <div className="auth-logo-text">ALU<span>Hub</span></div>
        </div>

        <div className="auth-form-wrap">
          <StepDots current={1} total={3} />
          <div className="auth-eyebrow">Company Account</div>
          <div className="auth-heading auth-anim">List your company</div>
          <div className="auth-sub auth-anim auth-anim-d1">
            Choose a plan, create your account, then pay to go live.
          </div>

          {/* Plan selection */}
          <div className="plan-grid auth-anim auth-anim-d1">
            {plans.map(p => (
              <div key={p.id} className={`plan-row ${form.plan === p.id ? 'selected' : ''}`} onClick={() => set('plan', p.id)}>
                <div className="plan-row-icon">{p.icon}</div>
                <div style={{ flex: 1 }}>
                  <div className="plan-row-name">{p.name}</div>
                  <div className="plan-row-feat">{p.feat}</div>
                </div>
                <div className="plan-row-price">{p.price}<span>/mo</span></div>
              </div>
            ))}
          </div>

          <div className="auth-field auth-anim auth-anim-d2">
            <label className="auth-label">Your name</label>
            <input className={`auth-input ${errors.name ? 'err' : ''}`} placeholder="Contact person"
              value={form.name} onChange={e => set('name', e.target.value)} />
            {errors.name && <div className="auth-err">⚠ {errors.name}</div>}
          </div>

          <div className="auth-field auth-anim auth-anim-d2">
            <label className="auth-label">Company name</label>
            <input className={`auth-input ${errors.company ? 'err' : ''}`} placeholder="e.g. MTN Rwanda"
              value={form.company} onChange={e => set('company', e.target.value)} />
            {errors.company && <div className="auth-err">⚠ {errors.company}</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }} className="auth-anim auth-anim-d2">
            <div className="auth-field">
              <label className="auth-label">Industry</label>
              <select className={`auth-input ${errors.industry ? 'err' : ''}`} value={form.industry} onChange={e => set('industry', e.target.value)}>
                <option value="">Select…</option>
                <option>Technology</option>
                <option>Finance & Banking</option>
                <option>Telecommunications</option>
                <option>Development / NGO</option>
                <option>Education</option>
                <option>Healthcare</option>
                <option>Consulting</option>
                <option>Other</option>
              </select>
              {errors.industry && <div className="auth-err">⚠ {errors.industry}</div>}
            </div>
            <div className="auth-field">
              <label className="auth-label">Company size</label>
              <select className="auth-input" value={form.size} onChange={e => set('size', e.target.value)}>
                <option value="">Size…</option>
                <option>1–10</option>
                <option>11–50</option>
                <option>51–200</option>
                <option>201–1000</option>
                <option>1000+</option>
              </select>
            </div>
          </div>

          <div className="auth-field auth-anim auth-anim-d3">
            <label className="auth-label">Work email</label>
            <input className={`auth-input ${errors.email ? 'err' : ''}`} type="email" placeholder="you@company.com"
              value={form.email} onChange={e => set('email', e.target.value)} />
            {errors.email && <div className="auth-err">⚠ {errors.email}</div>}
          </div>

          <div className="auth-field auth-anim auth-anim-d3">
            <label className="auth-label">Password</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">🔒</span>
              <input className={`auth-input ${errors.password ? 'err' : ''}`}
                type={showPwd ? 'text' : 'password'} placeholder="Min 8 characters"
                value={form.password} onChange={e => set('password', e.target.value)} />
              <button className="auth-pwd-toggle" type="button" onClick={() => setShowPwd(s => !s)}>
                {showPwd ? '🙈' : '👁'}
              </button>
            </div>
            {errors.password && <div className="auth-err">⚠ {errors.password}</div>}
          </div>

          <button className="auth-btn auth-btn-primary" onClick={submit} disabled={loading}>
            {loading ? '⏳ Setting up account…' : 'Continue to payment →'}
          </button>
          <div className="auth-switch"><span className="link" onClick={onBack}>← Back</span></div>
        </div>
      </div>

      <div className="auth-right">
        <AuthRight userType="company" />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  STEP 3: PAYMENT (Student $4/mo · Company $25–$150/mo)
// ══════════════════════════════════════════════════════════════════
function StepPayment({ session, onDone, onSkip }) {
  const { user, form, userType, plan } = session;
  const amount = userType === 'student' ? 4 : plan?.priceNum || 75;
  const planName = userType === 'student' ? 'ALU Hub Pro · $4/month' : `ALU Hub ${plan?.name} · ${plan?.price}/month`;

  const [method, setMethod] = useState('mtn'); // mtn | airtel | card
  const [momoNet, setMomoNet] = useState('mtn');
  const [phone, setPhone] = useState('');
  const [card, setCard] = useState({ num: '', exp: '', cvv: '', name: '' });
  const [status, setStatus] = useState('idle'); // idle | processing | success | error
  const [errMsg, setErrMsg] = useState('');

  const isMoMo = method === 'mtn' || method === 'airtel';

  async function handlePay() {
    if (isMoMo) {
      if (!validatePhone(phone)) { setErrMsg('Enter a valid 10-digit Rwanda phone number'); return; }
    } else {
      if (!card.num.replace(/\s/g, '').match(/^\d{16}$/)) { setErrMsg('Enter a valid 16-digit card number'); return; }
      if (!card.exp.match(/^\d{2}\/\d{2}$/)) { setErrMsg('Enter expiry as MM/YY'); return; }
      if (!card.cvv.match(/^\d{3,4}$/)) { setErrMsg('Enter a valid CVV'); return; }
    }
    setErrMsg('');
    setStatus('processing');

    const onSuccess = async (response) => {
      // Only accept confirmed successful payments from Flutterwave
      if (response.status === 'successful' || response.status === 'completed') {
        // Update Supabase profile
        if (user?.id) {
          await upsertProfile(user.id, {
            plan: userType === 'student' ? 'pro' : (plan?.id || 'standard'),
            plan_activated_at: new Date().toISOString(),
            flw_tx_ref: response.tx_ref,
          });
        }
        setStatus('success');
        setTimeout(() => onDone({ ...session, paymentRef: response.tx_ref }), 2200);
      } else {
        setStatus('error');
        setErrMsg('Payment was not completed (status: ' + response.status + '). Please check your phone and try again.');
      }
    };

    const onClose = () => { if (status === 'processing') setStatus('idle'); };

    if (isMoMo) {
      initFlutterwaveMoMo({
        amount: amount * 1300, // approx RWF conversion
        currency: 'RWF',
        phone, network: method,
        name: form.name, email: form.email,
        planName, onSuccess, onClose,
      });
    } else {
      initFlutterwaveCard({
        amount, currency: 'USD',
        name: form.name, email: form.email,
        planName, onSuccess, onClose,
      });
    }
  }

  if (status === 'processing') return (
    <div className="auth-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: 40 }}>
        <div className="pay-spinner" />
        <div className="pay-status-title">Processing payment…</div>
        <div className="pay-status-sub">
          {isMoMo ? `Check your phone (+250 ${phone}) for the ${method === 'mtn' ? 'MTN MoMo' : 'Airtel Money'} prompt` : 'Authorising your card…'}
        </div>
      </div>
    </div>
  );

  if (status === 'success') return (
    <div className="auth-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: 40, maxWidth: 400 }}>
        <div className="pay-success-icon">✓</div>
        <div className="pay-status-title">Payment confirmed!</div>
        <div className="pay-status-sub">
          Welcome to ALU Hub{userType === 'student' ? ' Pro' : ''}. Taking you to your dashboard…
        </div>
      </div>
    </div>
  );

  return (
    <div className="auth-shell">
      <div className="auth-left" style={{ overflowY: 'auto' }}>
        <div className="auth-logo">
          <div className="auth-logo-mark">A</div>
          <div className="auth-logo-text">ALU<span>Hub</span></div>
        </div>

        <div className="auth-form-wrap">
          <StepDots current={2} total={3} />
          <div className="auth-eyebrow">{userType === 'student' ? 'Upgrade to Pro' : 'Activate listing'}</div>
          <div className="auth-heading auth-anim">Payment</div>
          <div className="auth-sub auth-anim auth-anim-d1">
            Choose your preferred payment method.
          </div>

          {/* Order summary */}
          <div className="payment-summary-card auth-anim auth-anim-d1">
            <div className="payment-summary-row">
              <span>Plan</span>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>{planName}</span>
            </div>
            <div className="payment-summary-row">
              <span>Billing</span>
              <span>Monthly · Cancel anytime</span>
            </div>
            <div className="payment-summary-total">
              <span>Total today</span>
              <span className="amount">${amount} <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>/ {(amount * 1300).toLocaleString()} RWF</span></span>
            </div>
          </div>

          {/* Payment method selector */}
          <div className="pay-methods auth-anim auth-anim-d2">

            {/* MTN MoMo */}
            <div className={`pay-method ${method === 'mtn' ? 'active' : ''}`} onClick={() => { setMethod('mtn'); setMomoNet('mtn'); setErrMsg(''); }}>
              <div className="pay-method-header">
                <div className="pay-radio"><div className="pay-radio-dot" /></div>
                <div className="pay-method-icon">📱</div>
                <div>
                  <div className="pay-method-name">MTN Mobile Money</div>
                  <div className="pay-method-sub">Pay via MoMo prompt on your phone</div>
                </div>
                <span className="pay-method-badge popular">Popular</span>
              </div>
              {method === 'mtn' && (
                <div className="pay-body">
                  <div className="momo-logo">
                    <span className="momo-logo-badge momo-mtn">MTN</span>
                    <span className="momo-logo-name">Mobile Money Rwanda</span>
                  </div>
                  <label className="auth-label">MTN MoMo number</label>
                  <div className="phone-input-wrap">
                    <div className="phone-prefix"><span className="phone-prefix-flag">🇷🇼</span> +250</div>
                    <input className="phone-num-input" placeholder="78 000 0000" maxLength={10}
                      value={phone} onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); setErrMsg(''); }} />
                  </div>
                  <div className="momo-hint">
                    💡 After clicking Pay, you'll receive a prompt on your MTN phone to confirm with your MoMo PIN.
                  </div>
                </div>
              )}
            </div>

            {/* Airtel Money */}
            <div className={`pay-method ${method === 'airtel' ? 'active' : ''}`} onClick={() => { setMethod('airtel'); setMomoNet('airtel'); setErrMsg(''); }}>
              <div className="pay-method-header">
                <div className="pay-radio"><div className="pay-radio-dot" /></div>
                <div className="pay-method-icon">📱</div>
                <div>
                  <div className="pay-method-name">Airtel Money</div>
                  <div className="pay-method-sub">Pay via Airtel Money Rwanda</div>
                </div>
                <span className="pay-method-badge fast">Fast</span>
              </div>
              {method === 'airtel' && (
                <div className="pay-body">
                  <div className="momo-logo">
                    <span className="momo-logo-badge momo-airtel">AIRTEL</span>
                    <span className="momo-logo-name">Airtel Money Rwanda</span>
                  </div>
                  <label className="auth-label">Airtel Money number</label>
                  <div className="phone-input-wrap">
                    <div className="phone-prefix"><span className="phone-prefix-flag">🇷🇼</span> +250</div>
                    <input className="phone-num-input" placeholder="73 000 0000" maxLength={10}
                      value={phone} onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); setErrMsg(''); }} />
                  </div>
                  <div className="momo-hint">
                    💡 You'll receive an Airtel Money push notification to approve the payment.
                  </div>
                </div>
              )}
            </div>

            {/* Card */}
            <div className={`pay-method ${method === 'card' ? 'active' : ''}`} onClick={() => { setMethod('card'); setErrMsg(''); }}>
              <div className="pay-method-header">
                <div className="pay-radio"><div className="pay-radio-dot" /></div>
                <div className="pay-method-icon">💳</div>
                <div>
                  <div className="pay-method-name">Visa / Debit card</div>
                  <div className="pay-method-sub">Secure card payment via Flutterwave</div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                  <span className="card-brand">VISA</span>
                  <span className="card-brand">MC</span>
                </div>
              </div>
              {method === 'card' && (
                <div className="pay-body">
                  <div className="auth-field">
                    <label className="auth-label">Card number</label>
                    <input className="auth-input" placeholder="0000 0000 0000 0000" maxLength={19}
                      value={card.num}
                      onChange={e => {
                        const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
                        setCard(c => ({ ...c, num: raw.replace(/(.{4})/g, '$1 ').trim() }));
                        setErrMsg('');
                      }} />
                  </div>
                  <div className="card-row">
                    <div className="auth-field">
                      <label className="auth-label">Expiry</label>
                      <input className="auth-input" placeholder="MM/YY" maxLength={5}
                        value={card.exp}
                        onChange={e => {
                          let v = e.target.value.replace(/\D/g, '').slice(0, 4);
                          if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
                          setCard(c => ({ ...c, exp: v }));
                          setErrMsg('');
                        }} />
                    </div>
                    <div className="auth-field">
                      <label className="auth-label">CVV</label>
                      <input className="auth-input" placeholder="123" maxLength={4} type="password"
                        value={card.cvv}
                        onChange={e => { setCard(c => ({ ...c, cvv: e.target.value.replace(/\D/g, '') })); setErrMsg(''); }} />
                    </div>
                  </div>
                  <div className="auth-field">
                    <label className="auth-label">Name on card</label>
                    <input className="auth-input" placeholder="As it appears on card"
                      value={card.name}
                      onChange={e => { setCard(c => ({ ...c, name: e.target.value })); setErrMsg(''); }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {errMsg && <div className="auth-err" style={{ marginBottom: 10 }}>⚠ {errMsg}</div>}

          <button className="auth-btn auth-btn-primary" onClick={handlePay}>
            🔒 Pay ${amount} now
          </button>

          <div className="secure-row">
            <span>🔒</span>
            <span>Payments secured by Flutterwave · 256-bit encryption</span>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-right-content auth-anim">
          <div className="auth-right-badge">🔒 Secure checkout</div>
          <div className="auth-right-heading" style={{ fontSize: 26 }}>
            {userType === 'student'
              ? <>Unlock <span>full access</span> to ALU Hub</>
              : <>Go live and <span>start hiring</span></>
            }
          </div>
          <div className="auth-features">
            {(userType === 'student' ? [
              { icon: '🤖', title: 'AI CV matcher', desc: 'Know which internships fit you before applying' },
              { icon: '📚', title: 'Full resources library', desc: 'Notes, templates and case studies from top students' },
              { icon: '🎓', title: 'Skills sessions', desc: 'Book 1-on-1 tutoring in tech, business and more' },
              { icon: '🗺', title: 'Complete Kigali guide', desc: 'Everything you need to survive and thrive in Kigali' },
            ] : [
              { icon: '👁', title: 'Visible to 500+ students', desc: 'Your listing shown to ALU & CMU-Africa students' },
              { icon: '📩', title: 'Direct applications', desc: 'Candidates apply directly through the platform' },
              { icon: '🔄', title: 'Cancel anytime', desc: 'No contracts. Pause or cancel your listing whenever.' },
            ]).map((f, i) => (
              <div className="auth-feature" key={i}>
                <div className="auth-feature-icon">{f.icon}</div>
                <div>
                  <div className="auth-feature-title">{f.title}</div>
                  <div className="auth-feature-desc">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  LOGIN SCREEN  — supports both student and company accounts
// ══════════════════════════════════════════════════════════════════
function LoginScreen({ onDone, onBack }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loginType, setLoginType] = useState('student'); // 'student' | 'company'
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: null })); }

  async function submit() {
    const errs = {};
    if (!validateEmail(form.email)) errs.email = 'Enter your email';
    if (!form.password) errs.password = 'Enter your password';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    const { data, error } = await signIn(form.email, form.password);
    if (error) { setErrors({ password: error.message }); setLoading(false); return; }
    const profile = data?.user ? await getProfile(data.user.id) : null;
    setLoading(false);
    // Use profile user_type if available, otherwise use the selected login type
    const resolvedType = profile?.user_type || loginType;
    onDone({ user: data?.user, profile, form: { name: profile?.full_name || '', email: form.email }, userType: resolvedType });
  }

  return (
    <div className="auth-shell">
      <div className="auth-left">
        <div className="auth-logo">
          <div className="auth-logo-mark">A</div>
          <div className="auth-logo-text">ALU<span>Hub</span></div>
        </div>

        <div className="auth-form-wrap">
          <div className="auth-eyebrow">Welcome back</div>
          <div className="auth-heading auth-anim">Sign in</div>
          <div className="auth-sub auth-anim auth-anim-d1">
            Sign in to your ALU Hub account.
          </div>

          {/* Account type toggle */}
          <div className="user-type-grid auth-anim auth-anim-d1" style={{ marginBottom: 18 }}>
            <div
              className={`user-type-card ${loginType === 'student' ? 'selected' : ''}`}
              onClick={() => setLoginType('student')}
              style={{ padding: '10px 12px' }}
            >
              <span className="user-type-icon" style={{ fontSize: 20 }}>🎓</span>
              <div className="user-type-title" style={{ fontSize: 13 }}>Student</div>
            </div>
            <div
              className={`user-type-card ${loginType === 'company' ? 'selected' : ''}`}
              onClick={() => setLoginType('company')}
              style={{ padding: '10px 12px' }}
            >
              <span className="user-type-icon" style={{ fontSize: 20 }}>🏢</span>
              <div className="user-type-title" style={{ fontSize: 13 }}>Company</div>
            </div>
          </div>

          <div className="auth-field auth-anim auth-anim-d1">
            <label className="auth-label">Email</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">📧</span>
              <input className={`auth-input ${errors.email ? 'err' : ''}`} type="email"
                placeholder={loginType === 'company' ? 'you@company.com' : 'you@example.com'}
                value={form.email} onChange={e => set('email', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()} />
            </div>
            {errors.email && <div className="auth-err">⚠ {errors.email}</div>}
          </div>

          <div className="auth-field auth-anim auth-anim-d2">
            <label className="auth-label">Password</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">🔒</span>
              <input className={`auth-input ${errors.password ? 'err' : ''}`}
                type={showPwd ? 'text' : 'password'} placeholder="Your password"
                value={form.password} onChange={e => set('password', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()} />
              <button className="auth-pwd-toggle" type="button" onClick={() => setShowPwd(s => !s)}>
                {showPwd ? '🙈' : '👁'}
              </button>
            </div>
            {errors.password && <div className="auth-err">⚠ {errors.password}</div>}
          </div>

          <button className="auth-btn auth-btn-primary" onClick={submit} disabled={loading}>
            {loading ? '⏳ Signing in…' : `Sign in as ${loginType === 'company' ? 'Company' : 'Student'} →`}
          </button>

          <div className="auth-switch" style={{ marginTop: 18 }}>
            No account? <span className="link" onClick={onBack}>Create one</span>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <AuthRight userType={loginType} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  AUTH ROUTER — orchestrates the full flow
// ══════════════════════════════════════════════════════════════════
function AuthRouter({ onAuthComplete }) {
  const [step, setStep] = useState('type'); // type | student | company | payment | login
  const [session, setSession] = useState(null);

  function handleTypeSelect(type) {
    if (type === 'login') { setStep('login'); return; }
    setStep(type); // 'student' or 'company'
  }

  async function handleSignupDone(data) {
    // All users must pay before accessing the platform
    setSession(data);
    setStep('payment');
  }

  function handlePaymentDone(data) {
    onAuthComplete(data);
  }

  function handleLoginDone(data) {
    // All accounts with pending_payment must complete payment
    if (data.profile?.plan === 'pending_payment' || !data.profile?.plan) {
      setSession(data);
      setStep('payment');
      return;
    }
    onAuthComplete(data);
  }

  if (step === 'type') return <StepUserType onSelect={handleTypeSelect} />;
  if (step === 'student') return <StepStudentSignup onDone={handleSignupDone} onBack={() => setStep('type')} />;
  if (step === 'company') return <StepCompanySignup onDone={handleSignupDone} onBack={() => setStep('type')} />;
  if (step === 'payment') return <StepPayment session={session} onDone={handlePaymentDone} />;
  if (step === 'login') return <LoginScreen onDone={handleLoginDone} onBack={() => setStep('type')} />;
  return null;
}

// ══════════════════════════════════════════════════════════════════
//  MAIN APP WRAPPER
//  Checks Supabase session → shows Auth or Dashboard
// ══════════════════════════════════════════════════════════════════
function AppWithAuth() {
  const [authState, setAuthState] = useState('loading'); // loading | unauthenticated | authenticated
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    const session = await getSession();
    if (session?.user) {
      const profile = await getProfile(session.user.id);
      setCurrentUser({ user: session.user, profile, userType: profile?.user_type || 'student', form: { name: profile?.full_name, email: session.user.email } });
      setAuthState('authenticated');
    } else {
      setAuthState('unauthenticated');
    }
  }

  function handleAuthComplete(data) {
    setCurrentUser(data);
    setAuthState('authenticated');
    toast(`Welcome to ALU Hub, ${data.form?.name?.split(' ')[0] || 'friend'}! 🎉`);
  }

  function handleSignOut() {
    signOut();
    setCurrentUser(null);
    setAuthState('unauthenticated');
  }

  if (authState === 'demo') {
    // demo state removed — auth is now always required
    setAuthState('unauthenticated');
    return null;
  }

  if (authState === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="pay-spinner" />
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return <AuthRouter onAuthComplete={handleAuthComplete} />;
  }

  // ── Authenticated: hand off to the main App (defined in ALUHub.js which loads first) ──
  return <App user={currentUser} onSignOut={handleSignOut} />;
}

// ── RENDER ────────────────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById('root')).render(<AppWithAuth />);


/* ════════════════════════════════════════════════════════════════
   SUPABASE SQL SCHEMA
   Run this in your Supabase project → SQL Editor → New Query
   ════════════════════════════════════════════════════════════════

-- 1. Profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  created_at timestamptz default now(),
  full_name text,
  user_type text check (user_type in ('student', 'company')),
  school text,                    -- ALU or CMU-Africa
  major text,
  year text,
  company_name text,
  industry text,
  company_size text,
  plan text default 'free',       -- free | pro | basic | standard | premium | pending_payment
  plan_activated_at timestamptz,
  flw_tx_ref text,                -- Flutterwave transaction ref
  -- ▼ Added by Profile Page v1
  avatar_url text,                -- Supabase Storage public URL (WebP, compressed)
  bio text,                       -- Short bio / about
  linkedin text,
  github text,
  twitter text,
  website text,
  cv_filename text,               -- Original filename of uploaded CV
  cv_uploaded_at timestamptz,     -- When CV was last uploaded
  cv_last_matched_at timestamptz  -- Last time AI matching was refreshed
);

-- ▼ MIGRATION: run this if you already created the table above
-- alter table public.profiles add column if not exists avatar_url text;
-- alter table public.profiles add column if not exists bio text;
-- alter table public.profiles add column if not exists linkedin text;
-- alter table public.profiles add column if not exists github text;
-- alter table public.profiles add column if not exists twitter text;
-- alter table public.profiles add column if not exists website text;
-- alter table public.profiles add column if not exists cv_filename text;
-- alter table public.profiles add column if not exists cv_uploaded_at timestamptz;
-- alter table public.profiles add column if not exists cv_last_matched_at timestamptz;

-- ▼ STORAGE BUCKET: create in Supabase Dashboard → Storage → New bucket
-- Name: aluhub-media   Public: YES
-- Or via SQL:
-- insert into storage.buckets (id, name, public) values ('aluhub-media', 'aluhub-media', true)
--   on conflict do nothing;
-- create policy "Public read" on storage.objects for select using (bucket_id = 'aluhub-media');
-- create policy "Auth users upload" on storage.objects for insert
--   with check (bucket_id = 'aluhub-media' and auth.role() = 'authenticated');
-- create policy "Owner update" on storage.objects for update
--   using (bucket_id = 'aluhub-media' and auth.uid()::text = (storage.foldername(name))[2]);

-- 2. Row-level security
alter table public.profiles enable row level security;
create policy "Users can view their own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);
create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- 3b. Public student discovery (for student research in direct messages)
drop policy if exists "Public can discover student profiles" on public.profiles;
create policy "Public can discover student profiles" on public.profiles
  for select using (
    user_type = 'student'
  );

-- 3c. Student skills database
create table if not exists public.student_skills (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  student_id uuid references public.profiles(id) on delete cascade not null,
  skill_name text not null,
  level text default 'beginner' check (level in ('beginner','intermediate','advanced','expert')),
  years_experience numeric default 0,
  portfolio_url text,
  verified boolean default false,
  unique(student_id, skill_name)
);
create index if not exists student_skills_student_idx on public.student_skills(student_id);
create index if not exists student_skills_skill_idx on public.student_skills(skill_name);
alter table public.student_skills enable row level security;
create policy "Anyone can view student skills" on public.student_skills
  for select using (true);
create policy "Students can manage own skills" on public.student_skills
  for all using (auth.uid() = student_id) with check (auth.uid() = student_id);

-- 3d. Resource library
create table if not exists public.resources (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  author_id uuid references public.profiles(id) on delete set null,
  title text not null,
  author text,
  type text default 'Notes',
  price numeric default 0,
  sales integer default 0,
  emoji text default '📄',
  file_url text,
  file_name text,
  file_type text,
  file_size bigint
);
alter table public.resources enable row level security;
create policy "Anyone can read resources" on public.resources
  for select using (true);
create policy "Authenticated can publish resources" on public.resources
  for insert with check (auth.uid() = author_id);

-- 3e. Survival guide content
create table if not exists public.survival_guide (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  icon text default '🗺',
  title text not null,
  items jsonb not null default '[]'::jsonb
);
alter table public.survival_guide enable row level security;
create policy "Anyone can read guide" on public.survival_guide
  for select using (true);
create policy "Authenticated can manage guide" on public.survival_guide
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 4. Job listings (companies)
create table public.job_listings (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  company_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  type text,
  location text,
  pay text,
  duration text,
  deadline date,
  status text default 'active' check (status in ('active', 'closed', 'draft')),
  tags text[]
);
alter table public.job_listings enable row level security;
create policy "Anyone can view active listings" on public.job_listings
  for select using (status = 'active');
create policy "Companies can manage their listings" on public.job_listings
  for all using (auth.uid() = company_id);

-- 5. Applications (students apply to jobs)
create table public.applications (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  student_id uuid references public.profiles(id) on delete cascade,
  job_id uuid references public.job_listings(id) on delete cascade,
  status text default 'pending' check (status in ('pending', 'reviewed', 'shortlisted', 'rejected')),
  cv_url text,
  cover_note text,
  unique(student_id, job_id)
);
alter table public.applications enable row level security;
create policy "Students see their own applications" on public.applications
  for select using (auth.uid() = student_id);
create policy "Students can apply" on public.applications
  for insert with check (auth.uid() = student_id);

-- 6. Payments log
create table public.payments (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  user_id uuid references public.profiles(id) on delete cascade,
  amount numeric,
  currency text,
  method text,                    -- mtn | airtel | card
  flw_tx_ref text,
  plan text,
  status text default 'success'
);
alter table public.payments enable row level security;
create policy "Users see their own payments" on public.payments
  for select using (auth.uid() = user_id);

════════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════════════════════════
   NEW TABLES — add these to your existing Supabase schema

-- 6. Messages table (per-application threads)
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  application_id uuid references public.applications(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete cascade,
  text text,
  message_kind text default 'text' check (message_kind in ('text','image','file')),
  attachment_url text,
  attachment_name text,
  attachment_type text,
  attachment_size bigint
);
alter table public.messages enable row level security;
create policy "Participants can read messages" on public.messages
  for select using (
    auth.uid() = sender_id or
    auth.uid() in (
      select student_id from public.applications where id = application_id
      union
      select company_id from public.job_listings jl
      join public.applications a on a.job_id = jl.id where a.id = application_id
    )
  );
create policy "Authenticated can send messages" on public.messages
  for insert with check (auth.uid() = sender_id);

-- 7. Notifications table
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  user_id uuid references public.profiles(id) on delete cascade,
  type text, -- new_job | status_change | message
  title text,
  body text,
  read boolean default false
);
alter table public.notifications enable row level security;
create policy "Users see own notifications" on public.notifications
  for select using (auth.uid() = user_id);
create policy "System can insert notifications" on public.notifications
  for insert with check (true);
create policy "Users can mark own read" on public.notifications
  for update using (auth.uid() = user_id);

-- 8. Housing requests table
create table public.housing_requests (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  area text,
  dates text,
  people integer default 1,
  urgent boolean default false,
  status text default 'active' check (status in ('active','filled','deleted')),
  posted_by text
);
alter table public.housing_requests enable row level security;
create policy "Anyone can view active housing requests" on public.housing_requests
  for select using (status = 'active');
create policy "Auth users can post housing requests" on public.housing_requests
  for insert with check (auth.uid() = user_id);
create policy "Users can update own housing requests" on public.housing_requests
  for update using (auth.uid() = user_id);

-- 9. Direct messages (student-to-student)
create table public.direct_messages (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  thread_id text not null,           -- sorted(user_a__user_b) deterministic key
  sender_id uuid references public.profiles(id) on delete cascade,
  recipient_id uuid references public.profiles(id) on delete cascade,
  text text,
  message_kind text default 'text' check (message_kind in ('text','image','file')),
  attachment_url text,
  attachment_name text,
  attachment_type text,
  attachment_size bigint,
  read boolean default false
);
create index on public.direct_messages(thread_id);
create index on public.direct_messages(recipient_id, read);
alter table public.direct_messages enable row level security;
create policy "Participants can read DMs" on public.direct_messages
  for select using (auth.uid() = sender_id or auth.uid() = recipient_id);
create policy "Auth users can send DMs" on public.direct_messages
  for insert with check (auth.uid() = sender_id);
create policy "Recipients can mark DMs read" on public.direct_messages
  for update using (auth.uid() = recipient_id);

-- 10. Enable realtime on key tables (run in Supabase SQL editor)
alter publication supabase_realtime add table public.applications;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.direct_messages;
alter publication supabase_realtime add table public.housing_requests;
alter publication supabase_realtime add table public.student_skills;

-- ▼ MIGRATION HELPERS (run safely on existing DB)
-- alter table public.messages add column if not exists message_kind text default 'text';
-- alter table public.messages add column if not exists attachment_url text;
-- alter table public.messages add column if not exists attachment_name text;
-- alter table public.messages add column if not exists attachment_type text;
-- alter table public.messages add column if not exists attachment_size bigint;
-- alter table public.direct_messages add column if not exists message_kind text default 'text';
-- alter table public.direct_messages add column if not exists attachment_url text;
-- alter table public.direct_messages add column if not exists attachment_name text;
-- alter table public.direct_messages add column if not exists attachment_type text;
-- alter table public.direct_messages add column if not exists attachment_size bigint;
-- create table if not exists public.resources (
--   id uuid default gen_random_uuid() primary key,
--   created_at timestamptz default now(),
--   author_id uuid references public.profiles(id) on delete set null,
--   title text not null,
--   author text,
--   type text default 'Notes',
--   price numeric default 0,
--   sales integer default 0,
--   emoji text default '📄',
--   file_url text,
--   file_name text,
--   file_type text,
--   file_size bigint
-- );
-- alter table public.resources add column if not exists file_url text;
-- alter table public.resources add column if not exists file_name text;
-- alter table public.resources add column if not exists file_type text;
-- alter table public.resources add column if not exists file_size bigint;
-- create table if not exists public.survival_guide (
--   id uuid default gen_random_uuid() primary key,
--   created_at timestamptz default now(),
--   icon text default '🗺',
--   title text not null,
--   items jsonb not null default '[]'::jsonb
-- );

════════════════════════════════════════════════════════════════ */
