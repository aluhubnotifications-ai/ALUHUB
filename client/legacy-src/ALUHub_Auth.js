// ══════════════════════════════════════════════════════════════════
//  ALU HUB — AUTH SYSTEM  (ALUHub_Auth.js)
//  Supabase backend
//
//  HOW TO USE:
//  1. Create a Supabase project at supabase.com
//  2. Replace SUPABASE_URL and SUPABASE_ANON_KEY below
//  3. Run the SQL schema at the bottom of this file in Supabase SQL editor
//  4. Add ALUHub_Auth.css before ALUHub.css in your HTML
//  5. Replace the ALUHub.js <script> tag with this file
//     (or include both and this file second — it wraps the App)
// ══════════════════════════════════════════════════════════════════

const { useState, useEffect, useRef, useCallback } = React;

// ── CONFIG ──────────────────────────────────────────────────────
// Values come from client/.env (injected as window.__ALUHUB_ENV by
// index.html); the literals below are local-dev fallbacks.
const __ENV = (typeof window !== 'undefined' && window.__ALUHUB_ENV) || {};
// Guard against un-replaced Vite placeholders (e.g. '%VITE_SUPABASE_URL%' when no .env exists)
const _rawUrl  = __ENV.SUPABASE_URL;
const _rawKey  = __ENV.SUPABASE_ANON_KEY;
const _rawApi  = __ENV.API_URL;
const SUPABASE_URL   = (_rawUrl  && _rawUrl.startsWith('http'))  ? _rawUrl  : 'https://dkvrvnufajnwrrpvgsck.supabase.co';
const SUPABASE_ANON  = (_rawKey  && !_rawKey.startsWith('%'))    ? _rawKey  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrdnJ2bnVmYWpud3JycHZnc2NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxOTkyNjksImV4cCI6MjA5Mjc3NTI2OX0.BqAdsWxfgr0eCP9Imf9qV58W6Xx9lYFt6TGJ1EUj2HQ';
const API_URL        = (_rawApi  && _rawApi.startsWith('http'))  ? _rawApi  : 'http://localhost:4000';

// Student signup is gated to ALU emails only — any other domain must
// use Company or School signup. Add more domains here as new partner
// schools come online.
const STUDENT_DOMAINS = ['alustudent.com'];

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
  const headers = { 'Content-Type': 'application/json' };
  // Include the bearer token if we have one. Public endpoints (login,
  // register, refresh) ignore it; protected ones (change-email,
  // delete-account) need it or they 401.
  const token = getAccessToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}/api/auth${path}`, {
    method: 'POST',
    credentials: 'include',
    headers,
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
    // See ALUHub.js getSB(): the custom fetch wrapper reads the latest
    // access token from localStorage on every request so PostgREST
    // never falls back to the anon apikey mid-session.
    const authFetch = (input, init) => {
      init = init || {};
      const token = getAccessToken();
      const headers = new Headers(init.headers || {});
      if (token) headers.set('Authorization', 'Bearer ' + token);
      return fetch(input, { ...init, headers });
    };
    _sb = window._sbMain = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
      global: { fetch: authFetch },
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

async function changeEmail(newEmail, currentPassword) {
  const { data, error } = await apiAuth('/change-email', { newEmail, currentPassword });
  if (error) return { error };
  // Patch local stored user object so UI reflects the new email immediately.
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) {
      const u = JSON.parse(raw);
      u.email = data.email;
      localStorage.setItem(USER_KEY, JSON.stringify(u));
    }
  } catch {}
  return { data };
}

async function deleteAccount(currentPassword) {
  const { data, error } = await apiAuth('/delete-account', { currentPassword, confirm: 'DELETE' });
  if (error) return { error };
  // Successful deletion: clear all local state and sign out the SDK.
  setAccessToken(null);
  setStoredUser(null);
  if (_sb) {
    if (_sb.rest && _sb.rest.headers)           delete _sb.rest.headers['Authorization'];
    if (_sb.storage && _sb.storage.headers)     delete _sb.storage.headers['Authorization'];
    if (_sb.functions && _sb.functions.headers) delete _sb.functions.headers['Authorization'];
    if (_sb.realtime && typeof _sb.realtime.setAuth === 'function') _sb.realtime.setAuth(null);
  }
  return { data };
}

async function refreshSession() {
  const { data, error } = await apiAuth('/refresh', {});
  if (error) {
    setAccessToken(null);
    setStoredUser(null);
    // The refresh cookie is dead — the user has to sign in again. Flip the
    // React auth state so the login screen shows instead of leaving the
    // user stranded on a broken authenticated view firing 401s.
    if (typeof window.__forceAuthRedirect === 'function') {
      try { window.__forceAuthRedirect('Your session expired. Please sign in again.'); } catch (_) {}
    }
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

async function changePassword(currentPassword, newPassword) {
  const token = getAccessToken();
  if (!token) return { error: { message: 'Not signed in' } };
  const res = await fetch(`${API_URL}/api/auth/change-password`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok) return { error: { message: data.error || `Request failed (${res.status})` } };
  return { data };
}
window.changePassword = changePassword;

// Expose auth header helper so ALUHub.js (loaded separately) can attach
// the bearer token to AI API calls. Protected endpoints like /api/ai/match,
// /api/ai/rank, /api/ai/compass require it for per-student cache lookups.
window.__authHeaders = function authHeaders() {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function upsertProfile(userId, profile) {
  const client = sb();
  if (!client) return;
  const payload = { id: userId, ...profile };
  let { error } = await client.from('profiles').upsert(payload);
  // If a column doesn't exist yet (migration not run), retry without it
  // so the rest of the profile still saves.
  while (error && (error.code === '42703' || error.code === 'PGRST204')) {
    const m = (error.message || '').match(/'([^']+)' column/) ||
              (error.message || '').match(/column "?([a-z_]+)"? of relation/);
    const col = m && m[1];
    if (!col || !(col in payload)) break;
    delete payload[col];
    console.warn('[Auth] profiles column missing, retrying without:', col);
    ({ error } = await client.from('profiles').upsert(payload));
  }
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

// ── EMAIL VERIFY / PASSWORD RESET BOOTSTRAP ─────────────────────
// Handles ?verify_token=... and ?reset_token=... in the URL so links
// in our transactional emails land cleanly back on the SPA.
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
    const resetToken = params.get('reset_token');
    if (resetToken) {
      params.delete('reset_token');
      const newQs = params.toString();
      history.replaceState({}, '', window.location.pathname + (newQs ? `?${newQs}` : ''));
      window.__ALUHUB_RESET_TOKEN = resetToken;
    }
  } catch (e) {
    console.warn('[auth] verify bootstrap failed:', e);
  }
})();

// ── TOAST ─────────────────────────────────────────────────────────
function toast(msg) {
  const el = document.getElementById('toast');
  const txt = document.getElementById('toast-text');
  if (!el || !txt) return;
  txt.textContent = msg;
  el.classList.add('on');
  setTimeout(() => el.classList.remove('on'), 3200);
}

// ── FACEBOOK-STYLE TOP PROGRESS BAR ─────────────────────────────────
function TopProgressBar() {
  const [bar, setBar] = React.useState({ on: false, w: 0, fade: false });
  React.useEffect(() => {
    let t1, t2;
    window.__npStart = () => {
      clearTimeout(t1); clearTimeout(t2);
      setBar({ on: true, w: 0, fade: false });
      requestAnimationFrame(() => {
        setBar({ on: true, w: 28, fade: false });
        t1 = setTimeout(() => setBar(b => ({ ...b, w: 72 })), 350);
      });
    };
    window.__npDone = () => {
      clearTimeout(t1); clearTimeout(t2);
      setBar(b => ({ ...b, w: 100, fade: false }));
      t2 = setTimeout(() => {
        setBar(b => ({ ...b, fade: true }));
        t2 = setTimeout(() => setBar({ on: false, w: 0, fade: false }), 380);
      }, 180);
    };
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  if (!bar.on) return null;
  const tran = bar.w >= 100 ? 'width .18s ease-in'
    : bar.w >= 60 ? 'width 4.5s cubic-bezier(.04,.6,.3,1)'
    : 'width .38s ease';
  return React.createElement('div', {
    style: {
      position: 'fixed', top: 0, left: 0, right: 0, height: 3,
      zIndex: 999999, pointerEvents: 'none',
      opacity: bar.fade ? 0 : 1,
      transition: bar.fade ? 'opacity .38s' : 'none',
    }
  },
    React.createElement('div', {
      style: {
        height: '100%', width: bar.w + '%',
        background: 'linear-gradient(90deg,#2563EB,#60a5fa)',
        transition: tran,
        borderRadius: '0 3px 3px 0',
        boxShadow: '0 0 10px rgba(37,99,235,.7)',
        position: 'relative', overflow: 'hidden',
      }
    },
      React.createElement('div', {
        style: {
          position: 'absolute', top: 0, right: 0, bottom: 0, width: 80,
          background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.45),transparent)',
          animation: 'npShimmer 1s ease-in-out infinite',
        }
      })
    )
  );
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
    { icon: '💼', title: 'Post internships directly', desc: 'Reach 500+ verified ALU students' },
    { icon: '🎯', title: 'AI-matched candidates', desc: 'Students\' CVs are ranked by fit to your listing' },
    { icon: '📊', title: 'Track applications', desc: 'See who applied, shortlist, and message candidates' },
    { icon: '🚀', title: 'Company profile page', desc: 'Branded listing with your jobs and culture' },
  ] : [
    { icon: '💼', title: 'Internship board', desc: '14+ verified Kigali internships with AI CV matching' },
    { icon: '🎓', title: 'Skills marketplace', desc: 'Book 1-on-1 sessions with top ALU students' },
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
//  STEP 1: AUTH LANDING  (Sign Up / Log In split)
// ══════════════════════════════════════════════════════════════════
function StepUserType({ onSelect }) {
  const [tab, setTab] = useState('signup'); // 'signup' | 'login'
  const [selected, setSelected] = useState(null);

  // "Log In" tab is just a redirect — keep it instant
  function goLogin() { onSelect('login'); }

  const tabBtn = (label, active, onClick) => (
    <button onClick={onClick} style={{
      flex:1, padding:'10px 0', fontWeight:700, fontSize:14,
      background: active ? '#0A2E5C' : 'transparent',
      color: active ? '#fff' : 'var(--text2)',
      border: active ? '2px solid #0A2E5C' : '2px solid var(--border)',
      borderRadius:10, cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif",
      transition:'all .15s',
    }}>{label}</button>
  );

  return (
    <div className="auth-shell">
      <div className="auth-left">
        <div className="auth-logo">
          <div className="auth-logo-mark"><img src="/logo.svg" alt="ALUHub"/></div>
          <div className="auth-logo-text">ALU<span>Hub</span></div>
        </div>

        <div className="auth-form-wrap">
          {/* Primary action tabs */}
          <div style={{display:'flex',gap:8,marginBottom:24}}>
            {tabBtn('Sign Up', tab==='signup', ()=>setTab('signup'))}
            {tabBtn('Log In', tab==='login', goLogin)}
          </div>

          <div className="auth-heading auth-anim" style={{marginBottom:6}}>
            {tab === 'signup' ? 'Create your account' : 'Welcome back'}
          </div>
          <div className="auth-sub auth-anim auth-anim-d1">
            Choose your account type to get started.
          </div>

          <div className="user-type-grid auth-anim auth-anim-d2">
            <div className={`user-type-card ${selected==='student'?'selected':''}`} onClick={()=>setSelected('student')}>
              <span className="user-type-icon">🎓</span>
              <div className="user-type-title">Student</div>
              <div className="user-type-desc">Find internships & career resources</div>
            </div>
            <div className={`user-type-card ${selected==='company'?'selected':''}`} onClick={()=>setSelected('company')}>
              <span className="user-type-icon">🏢</span>
              <div className="user-type-title">Company</div>
              <div className="user-type-desc">Post roles & hire ALU talent</div>
            </div>
            <div className={`user-type-card ${selected==='school'?'selected':''}`} onClick={()=>setSelected('school')}>
              <span className="user-type-icon">🏫</span>
              <div className="user-type-title">School</div>
              <div className="user-type-desc">Forward opportunities to your students</div>
            </div>
          </div>

          {selected === 'student' && (
            <div style={{marginTop:6,padding:'9px 12px',borderRadius:8,fontSize:12,color:'var(--text2)',background:'rgba(79,70,229,.06)',border:'1px solid rgba(79,70,229,.12)'}}>
              🎓 Student accounts require an <strong>@alustudent.com</strong> email address.
            </div>
          )}
          {selected === 'company' && (
            <div style={{marginTop:6,padding:'9px 12px',borderRadius:8,fontSize:12,color:'var(--text2)',background:'rgba(79,70,229,.06)',border:'1px solid rgba(79,70,229,.12)'}}>
              🏢 Company accounts can post internships and hire top African talent.
            </div>
          )}
          {selected === 'school' && (
            <div style={{marginTop:6,padding:'9px 12px',borderRadius:8,fontSize:12,color:'var(--text2)',background:'rgba(79,70,229,.06)',border:'1px solid rgba(79,70,229,.12)'}}>
              🏫 School accounts can post their own roles AND forward external employer listings.
            </div>
          )}

          <button
            className="auth-btn auth-btn-primary"
            disabled={!selected}
            onClick={() => onSelect(selected)}
            style={{ marginTop: 18 }}
          >
            Continue →
          </button>
        </div>
      </div>

      <div className="auth-right">
        <AuthRight userType={selected || 'student'} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  PRIVACY POLICY MODAL
//  Rendered inline in every signup form when the user clicks the
//  "Privacy Policy" link in the consent checkbox.
// ══════════════════════════════════════════════════════════════════
function PrivacyPolicyModal({ onClose }) {
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:16,maxWidth:640,width:'100%',maxHeight:'85vh',display:'flex',flexDirection:'column',boxShadow:'0 24px 80px rgba(0,0,0,.25)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 24px',borderBottom:'1px solid #e5e7eb'}}>
          <div style={{fontWeight:800,fontSize:17,color:'#0A2E5C',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Privacy Policy & Terms of Service</div>
          <button onClick={onClose} style={{background:'#f3f4f6',border:'none',borderRadius:8,width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:18,color:'#6b7280'}}>✕</button>
        </div>
        <div style={{overflowY:'auto',padding:'20px 24px',fontSize:13.5,color:'#374151',lineHeight:1.75}}>
          <p style={{fontSize:11,color:'#9ca3af',marginBottom:18}}>Last updated: May 27, 2026 · Drafted with Claude AI assistance</p>

          <h3 style={{fontSize:14,fontWeight:700,color:'#0A2E5C',marginBottom:6,marginTop:0}}>1. Who We Are</h3>
          <p style={{marginBottom:16}}>ALUHub is a career platform built exclusively for students and alumni of the African Leadership University (ALU) and CMU-Africa. We connect students with internships, full-time roles, and career resources from verified employers across Africa and beyond.</p>

          <h3 style={{fontSize:14,fontWeight:700,color:'#0A2E5C',marginBottom:6}}>2. Information We Collect</h3>
          <p style={{marginBottom:8}}><strong>Account data:</strong> Name, email address, and password. Passwords are hashed using bcrypt (cost 12) — we never store or transmit them in plain text.</p>
          <p style={{marginBottom:8}}><strong>Profile data:</strong> School, program, year, biography, career preferences (desired roles, industries, skills), LinkedIn/GitHub links, profile photo, and CV. All optional except school and email.</p>
          <p style={{marginBottom:16}}><strong>Usage data:</strong> Pages visited and features used, collected for platform improvement only. This data is never sold or shared with advertisers.</p>

          <h3 style={{fontSize:14,fontWeight:700,color:'#0A2E5C',marginBottom:6}}>3. Claude AI — Our 6 Agents & Exactly What We Share</h3>
          <p style={{marginBottom:8}}>ALUHub uses Anthropic's Claude AI across six specialised agents. We cache AI results in our database to avoid re-processing your data unnecessarily.</p>
          <ul style={{marginBottom:10,paddingLeft:20}}>
            <li><strong>Match</strong> — scores every job listing against your career profile. Results are stored and reused across other features so we never re-score the same job twice.</li>
            <li><strong>Rank</strong> — orders your job feed by personal fit using cached match scores.</li>
            <li><strong>Chat</strong> — answers career questions using your profile as context for personalised advice.</li>
            <li><strong>Coach</strong> — writes, critiques, and refines a cover-letter paragraph for a specific job in three internal stages.</li>
            <li><strong>Company</strong> — researches a company and returns honest insights to help you prepare.</li>
            <li><strong>Compass</strong> — a multi-turn career counsellor that interviews you, recommends top opportunities, and builds a personalised prep plan.</li>
          </ul>
          <p style={{marginBottom:4}}><strong style={{color:'#059669'}}>✓ Sent to Claude:</strong></p>
          <ul style={{marginBottom:8,paddingLeft:20}}>
            <li>Your career preferences: desired roles, preferred industries, skills, work type</li>
            <li>Your bio and major (if provided)</li>
            <li>Anonymised job listing data (title, description, tags, location — no applicant data)</li>
            <li>Your conversation messages when using Chat or Compass (capped at last 20 turns)</li>
          </ul>
          <p style={{marginBottom:4}}><strong style={{color:'#dc2626'}}>✗ Never sent to Claude:</strong></p>
          <ul style={{marginBottom:8,paddingLeft:20}}>
            <li>Your name, email address, or student ID</li>
            <li>Your nationality, gender, or any other demographic identifier</li>
            <li>Your CV file or any uploaded document</li>
            <li>Your application history or messages with employers</li>
          </ul>
          <p style={{marginBottom:16}}>Match scores are <strong>honest</strong> — every agent is explicitly instructed not to inflate scores or manufacture positives. A 45% match is a genuine 45%. Results include specific reasons tied to your real profile fields.</p>

          <h3 style={{fontSize:14,fontWeight:700,color:'#0A2E5C',marginBottom:6}}>4. How We Use Your Data</h3>
          <ul style={{marginBottom:16,paddingLeft:20}}>
            <li>To create and maintain your account and profile</li>
            <li>To match you with relevant job listings using AI analysis (cached per student)</li>
            <li>To send notifications about new jobs, application updates, and messages</li>
            <li>To display your profile to companies you apply to (with your consent via each application)</li>
            <li>To generate personalised career advice, application coaching, and prep plans through our AI agents</li>
          </ul>

          <h3 style={{fontSize:14,fontWeight:700,color:'#0A2E5C',marginBottom:6}}>5. Data Security & Storage</h3>
          <p style={{marginBottom:16}}>Your data is stored in Supabase (PostgreSQL), hosted in a SOC 2 compliant environment. Profile photos and CVs are stored in Supabase Storage. All connections use TLS encryption. Access is restricted by Row-Level Security — you can only read and write your own data. AI match results are cached in our database and automatically invalidated when your profile or a job listing changes.</p>

          <h3 style={{fontSize:14,fontWeight:700,color:'#0A2E5C',marginBottom:6}}>6. Your Rights</h3>
          <ul style={{marginBottom:16,paddingLeft:20}}>
            <li><strong>Access:</strong> View all your data at any time via your Profile page</li>
            <li><strong>Edit:</strong> Update your information at any time in Profile → Edit Profile</li>
            <li><strong>Opt out of AI:</strong> Simply do not use the AI Matching, AI Insights, Coach, or Compass features</li>
            <li><strong>Delete:</strong> Delete your account instantly in Profile → Account &amp; Security → Delete account. All your data — including cached AI results — is wiped immediately.</li>
          </ul>

          <h3 style={{fontSize:14,fontWeight:700,color:'#0A2E5C',marginBottom:6}}>7. Terms of Service</h3>
          <ul style={{marginBottom:16,paddingLeft:20}}>
            <li>ALUHub student accounts are for students and alumni of ALU and CMU-Africa only</li>
            <li>Company accounts must represent a real, operating organisation</li>
            <li>Job listings must be genuine opportunities — spam or fraudulent listings will result in immediate removal and account ban</li>
            <li>You may not use ALUHub to collect student data for purposes other than genuine hiring</li>
            <li>AI-generated content (cover letters, prep plans, company research) is provided as a starting point — you are responsible for verifying and personalising it before use</li>
            <li>We reserve the right to suspend accounts that violate these terms</li>
          </ul>

          <h3 style={{fontSize:14,fontWeight:700,color:'#0A2E5C',marginBottom:6}}>8. Contact</h3>
          <p>Questions about this policy or your data? Reach us through the ALUHub platform messaging system or at the email associated with your institution.</p>
        </div>
        <div style={{padding:'14px 24px',borderTop:'1px solid #e5e7eb'}}>
          <button onClick={onClose} style={{width:'100%',padding:'10px',background:'#0A2E5C',color:'#fff',border:'none',borderRadius:9,fontWeight:700,fontSize:14,cursor:'pointer'}}>I have read this — Close</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  STEP 2a: STUDENT SIGNUP
// ══════════════════════════════════════════════════════════════════
function StepStudentSignup({ onDone, onBack }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', school: 'ALU', major: '', year: '', agreed: false });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: null })); }

  async function submit() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!validateEmail(form.email)) errs.email = 'Enter a valid email address';
    else if (!isStudentEmail(form.email)) {
      errs.email = `Student signup is for ALU emails only — use a ${STUDENT_DOMAINS.map(d => '@' + d).join(' or ')} address. Choose Company or School if you're not a student.`;
    }
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!form.major) errs.major = 'Select your program';
    if (!form.year) errs.year = 'Select your year';
    if (!form.agreed) errs.agreed = 'You must accept the Privacy Policy and Terms of Service to continue.';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    if (window.__npStart) window.__npStart();
    const { data, error } = await signUp(form.email, form.password, {
      full_name: form.name,
      user_type: 'student',
      school: form.school,
      major: form.major,
      year: form.year,
    });
    if (error) { setErrors({ email: error.message }); setLoading(false); if (window.__npDone) window.__npDone(); return; }
    if (data?.user) {
      await upsertProfile(data.user.id, {
        full_name: form.name,
        user_type: 'student',
        school: form.school,
        major: form.major,
        year: form.year,
        plan: 'free',
      });
    }
    // Re-fetch the saved profile so the app has the full row in state
    // — otherwise downstream pages read user.profile as {} and show blanks.
    const profile = data?.user ? await getProfile(data.user.id) : null;
    setLoading(false);
    if (window.__npDone) window.__npDone();
    onDone({ user: data?.user, profile, form, userType: 'student' });
  }

  return (
    <div className="auth-shell">
      <div className="auth-left">
        <div className="auth-logo">
          <div className="auth-logo-mark"><img src="/logo.svg" alt="ALUHub"/></div>
          <div className="auth-logo-text">ALU<span>Hub</span></div>
        </div>

        <div className="auth-form-wrap">
          <StepDots current={1} total={2} />
          <div className="auth-eyebrow">Student Account</div>
          <div className="auth-heading auth-anim">Create your profile</div>
          <div className="auth-sub auth-anim auth-anim-d1">
            You'll need your ALU email to verify enrollment.
          </div>

          <div className="auth-field auth-anim auth-anim-d1">
            <label className="auth-label">Full name</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon material-symbols-rounded">person</span>
              <input className={`auth-input ${errors.name ? 'err' : ''}`} placeholder="Jean Chretien Horugavye"
                value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            {errors.name && <div className="auth-err"><span className="material-symbols-rounded" style={{fontSize:13}}>error</span>{errors.name}</div>}
          </div>

          <div className="auth-field auth-anim auth-anim-d1">
            <label className="auth-label">Email</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon material-symbols-rounded">mail</span>
              <input className={`auth-input ${errors.email ? 'err' : ''}`}
                placeholder="you@alustudent.com" type="email" autoComplete="email"
                value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            {errors.email && <div className="auth-err"><span className="material-symbols-rounded" style={{fontSize:13}}>error</span>{errors.email}</div>}
          </div>

          <div className="auth-field auth-anim auth-anim-d2">
            <label className="auth-label">Password</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon material-symbols-rounded">lock</span>
              <input className={`auth-input ${errors.password ? 'err' : ''}`}
                type={showPwd ? 'text' : 'password'} placeholder="Min 8 characters"
                value={form.password} onChange={e => set('password', e.target.value)} />
              <button className="auth-pwd-toggle" type="button" onClick={() => setShowPwd(s => !s)}>
                <span className="material-symbols-rounded">{showPwd ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            {errors.password && <div className="auth-err"><span className="material-symbols-rounded" style={{fontSize:13}}>error</span>{errors.password}</div>}
          </div>

          <div className="auth-field auth-anim auth-anim-d2">
            <label className="auth-label">Confirm password</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon material-symbols-rounded">lock</span>
              <input className={`auth-input ${errors.confirmPassword ? 'err' : ''}`}
                type={showConfirmPwd ? 'text' : 'password'} placeholder="Re-enter your password"
                value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} />
              <button className="auth-pwd-toggle" type="button" onClick={() => setShowConfirmPwd(s => !s)}>
                <span className="material-symbols-rounded">{showConfirmPwd ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            {errors.confirmPassword && <div className="auth-err"><span className="material-symbols-rounded" style={{fontSize:13}}>error</span>{errors.confirmPassword}</div>}
          </div>

          <div className="auth-field auth-anim auth-anim-d2">
            <label className="auth-label">Year</label>
            <select className={`auth-input ${errors.year ? 'err' : ''}`} value={form.year} onChange={e => set('year', e.target.value)}>
              <option value="">Year…</option>
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
            </select>
            {errors.year && <div className="auth-err"><span className="material-symbols-rounded" style={{fontSize:13}}>error</span>{errors.year}</div>}
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
            {errors.major && <div className="auth-err"><span className="material-symbols-rounded" style={{fontSize:13}}>error</span>{errors.major}</div>}
          </div>

          <div className="auth-field">
            <label style={{display:'flex',alignItems:'flex-start',gap:10,cursor:'pointer'}}>
              <input type="checkbox" checked={form.agreed} onChange={e=>set('agreed',e.target.checked)} style={{marginTop:3,width:15,height:15,accentColor:'#0A2E5C',flexShrink:0,cursor:'pointer'}}/>
              <span style={{fontSize:12,color:'#6b7280',lineHeight:1.65}}>
                I have read and agree to the{' '}
                <span className="link" style={{color:'#0A2E5C',fontWeight:600}} onClick={e=>{e.preventDefault();setShowPrivacy(true);}}>Privacy Policy & Terms of Service</span>.
                {' '}I understand that ALUHub uses Claude AI for job matching and that only my career preferences — never my name, email, or ID — are shared with the AI.
              </span>
            </label>
            {errors.agreed && <div className="auth-err" style={{marginTop:6}}><span className="material-symbols-rounded" style={{fontSize:13}}>error</span>{errors.agreed}</div>}
          </div>

          <button className="auth-btn auth-btn-primary" onClick={submit} disabled={loading}>
            {loading ? <><span className="auth-btn-spinner"/>Creating account…</> : 'Create account →'}
          </button>

          <div className="auth-switch">
            <span className="link" onClick={onBack}>← Back</span>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <AuthRight userType="student" />
      </div>
      {showPrivacy && <PrivacyPolicyModal onClose={()=>setShowPrivacy(false)}/>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  STEP 2b: COMPANY SIGNUP
// ══════════════════════════════════════════════════════════════════
function StepCompanySignup({ onDone, onBack }) {
  const [form, setForm] = useState({ name: '', company: '', email: '', password: '', confirmPassword: '', industry: '', size: '', agreed: false });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: null })); }

  async function submit() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Contact name required';
    if (!form.company.trim()) errs.company = 'Company name required';
    if (!validateEmail(form.email)) errs.email = 'Enter a valid email';
    if (form.password.length < 8) errs.password = 'Min 8 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!form.industry) errs.industry = 'Select industry';
    if (!form.agreed) errs.agreed = 'You must accept the Privacy Policy and Terms of Service to continue.';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    if (window.__npStart) window.__npStart();
    const { data, error } = await signUp(form.email, form.password, {
      full_name: form.name,
      company_name: form.company,
      user_type: 'company',
      plan: form.plan,
    });
    if (error) { setErrors({ email: error.message }); setLoading(false); if (window.__npDone) window.__npDone(); return; }
    if (data?.user) {
      await upsertProfile(data.user.id, {
        full_name: form.name,
        company_name: form.company,
        user_type: 'company',
        industry: form.industry,
        company_size: form.size,
        plan: 'free',
      });
    }
    // Re-fetch the saved profile so the company profile page can render
    // the company name + industry immediately without a blank-state flash.
    const profile = data?.user ? await getProfile(data.user.id) : null;
    setLoading(false);
    if (window.__npDone) window.__npDone();
    onDone({ user: data?.user, profile, form, userType: 'company' });
  }

  return (
    <div className="auth-shell">
      <div className="auth-left" style={{ overflowY: 'auto' }}>
        <div className="auth-logo">
          <div className="auth-logo-mark"><img src="/logo.svg" alt="ALUHub"/></div>
          <div className="auth-logo-text">ALU<span>Hub</span></div>
        </div>

        <div className="auth-form-wrap">
          <StepDots current={1} total={2} />
          <div className="auth-eyebrow">Company Account</div>
          <div className="auth-heading auth-anim">List your company</div>
          <div className="auth-sub auth-anim auth-anim-d1">
            Create your company account to post internships and hire top African talent.
          </div>

          <div className="auth-field auth-anim auth-anim-d2">
            <label className="auth-label">Your name</label>
            <input className={`auth-input ${errors.name ? 'err' : ''}`} placeholder="Contact person"
              value={form.name} onChange={e => set('name', e.target.value)} />
            {errors.name && <div className="auth-err"><span className="material-symbols-rounded" style={{fontSize:13}}>error</span>{errors.name}</div>}
          </div>

          <div className="auth-field auth-anim auth-anim-d2">
            <label className="auth-label">Company name</label>
            <input className={`auth-input ${errors.company ? 'err' : ''}`} placeholder="e.g. MTN Rwanda"
              value={form.company} onChange={e => set('company', e.target.value)} />
            {errors.company && <div className="auth-err"><span className="material-symbols-rounded" style={{fontSize:13}}>error</span>{errors.company}</div>}
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
              {errors.industry && <div className="auth-err"><span className="material-symbols-rounded" style={{fontSize:13}}>error</span>{errors.industry}</div>}
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
            {errors.email && <div className="auth-err"><span className="material-symbols-rounded" style={{fontSize:13}}>error</span>{errors.email}</div>}
          </div>

          <div className="auth-field auth-anim auth-anim-d3">
            <label className="auth-label">Password</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon material-symbols-rounded">lock</span>
              <input className={`auth-input ${errors.password ? 'err' : ''}`}
                type={showPwd ? 'text' : 'password'} placeholder="Min 8 characters"
                value={form.password} onChange={e => set('password', e.target.value)} />
              <button className="auth-pwd-toggle" type="button" onClick={() => setShowPwd(s => !s)}>
                <span className="material-symbols-rounded">{showPwd ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            {errors.password && <div className="auth-err"><span className="material-symbols-rounded" style={{fontSize:13}}>error</span>{errors.password}</div>}
          </div>

          <div className="auth-field auth-anim auth-anim-d3">
            <label className="auth-label">Confirm password</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon material-symbols-rounded">lock</span>
              <input className={`auth-input ${errors.confirmPassword ? 'err' : ''}`}
                type={showConfirmPwd ? 'text' : 'password'} placeholder="Re-enter your password"
                value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} />
              <button className="auth-pwd-toggle" type="button" onClick={() => setShowConfirmPwd(s => !s)}>
                <span className="material-symbols-rounded">{showConfirmPwd ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            {errors.confirmPassword && <div className="auth-err"><span className="material-symbols-rounded" style={{fontSize:13}}>error</span>{errors.confirmPassword}</div>}
          </div>

          <div className="auth-field">
            <label style={{display:'flex',alignItems:'flex-start',gap:10,cursor:'pointer'}}>
              <input type="checkbox" checked={form.agreed} onChange={e=>set('agreed',e.target.checked)} style={{marginTop:3,width:15,height:15,accentColor:'#0A2E5C',flexShrink:0,cursor:'pointer'}}/>
              <span style={{fontSize:12,color:'#6b7280',lineHeight:1.65}}>
                I agree to the{' '}
                <span className="link" style={{color:'#0A2E5C',fontWeight:600}} onClick={e=>{e.preventDefault();setShowPrivacy(true);}}>Privacy Policy & Terms of Service</span>.
                {' '}Company accounts must represent a real organisation. Job listings must be genuine opportunities.
              </span>
            </label>
            {errors.agreed && <div className="auth-err" style={{marginTop:6}}><span className="material-symbols-rounded" style={{fontSize:13}}>error</span>{errors.agreed}</div>}
          </div>

          <button className="auth-btn auth-btn-primary" onClick={submit} disabled={loading}>
            {loading ? <><span className="auth-btn-spinner"/>Creating account…</> : 'Create account →'}
          </button>
          <div className="auth-switch"><span className="link" onClick={onBack}>← Back</span></div>
        </div>
      </div>

      <div className="auth-right">
        <AuthRight userType="company" />
      </div>
      {showPrivacy && <PrivacyPolicyModal onClose={()=>setShowPrivacy(false)}/>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  STEP 2c: SCHOOL SIGNUP
// ══════════════════════════════════════════════════════════════════
function StepSchoolSignup({ onDone, onBack }) {
  const [form, setForm] = useState({ name: '', school: '', email: '', password: '', confirmPassword: '', location: '', student_email_domain: '', agreed: false });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: null })); }

  async function submit() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Contact name required';
    if (!form.school.trim()) errs.school = 'School name required';
    if (!validateEmail(form.email)) errs.email = 'Enter a valid email';
    if (form.password.length < 8) errs.password = 'Min 8 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    // Normalize domain: strip protocol, leading @ and trailing slash
    const cleanDomain = form.student_email_domain.trim().toLowerCase()
      .replace(/^https?:\/\//, '').replace(/^@/, '').replace(/\/$/, '');
    if (cleanDomain && !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(cleanDomain)) {
      errs.student_email_domain = 'Use a domain like alustudent.com';
    }
    if (!form.agreed) errs.agreed = 'You must accept the Privacy Policy and Terms of Service to continue.';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    if (window.__npStart) window.__npStart();
    const { data, error } = await signUp(form.email, form.password, {
      full_name: form.name,
      company_name: form.school,
      user_type: 'school',
    });
    if (error) { setErrors({ email: error.message }); setLoading(false); if (window.__npDone) window.__npDone(); return; }
    if (data?.user) {
      await upsertProfile(data.user.id, {
        full_name: form.name,
        company_name: form.school,
        user_type: 'school',
        location: form.location,
        student_email_domain: cleanDomain || null,
        plan: 'free',
      });
    }
    // Re-fetch the saved profile so the school profile page renders the
    // school name + contact name immediately. Without this the page reads
    // user.profile as {} and shows "Your School Name" placeholders.
    const profile = data?.user ? await getProfile(data.user.id) : null;
    setLoading(false);
    if (window.__npDone) window.__npDone();
    onDone({ user: data?.user, profile, form, userType: 'school' });
  }

  return (
    <div className="auth-shell">
      <div className="auth-left" style={{ overflowY: 'auto' }}>
        <div className="auth-logo">
          <div className="auth-logo-mark"><img src="/logo.svg" alt="ALUHub"/></div>
          <div className="auth-logo-text">ALU<span>Hub</span></div>
        </div>

        <div className="auth-form-wrap">
          <StepDots current={1} total={2} />
          <div className="auth-eyebrow">School Account</div>
          <div className="auth-heading auth-anim">Set up your school</div>
          <div className="auth-sub auth-anim auth-anim-d1">
            Post your own roles and forward employer opportunities to your students.
          </div>

          <div className="auth-field auth-anim auth-anim-d2">
            <label className="auth-label">Your name</label>
            <input className={`auth-input ${errors.name ? 'err' : ''}`} placeholder="Career services contact"
              value={form.name} onChange={e => set('name', e.target.value)} />
            {errors.name && <div className="auth-err"><span className="material-symbols-rounded" style={{fontSize:13}}>error</span>{errors.name}</div>}
          </div>

          <div className="auth-field auth-anim auth-anim-d2">
            <label className="auth-label">School name</label>
            <input className={`auth-input ${errors.school ? 'err' : ''}`} placeholder="e.g. African Leadership University"
              value={form.school} onChange={e => set('school', e.target.value)} />
            {errors.school && <div className="auth-err"><span className="material-symbols-rounded" style={{fontSize:13}}>error</span>{errors.school}</div>}
          </div>

          <div className="auth-field auth-anim auth-anim-d3">
            <label className="auth-label">Email</label>
            <input className={`auth-input ${errors.email ? 'err' : ''}`} type="email" placeholder="careers@school.edu"
              value={form.email} onChange={e => set('email', e.target.value)} />
            {errors.email && <div className="auth-err"><span className="material-symbols-rounded" style={{fontSize:13}}>error</span>{errors.email}</div>}
          </div>

          <div className="auth-field auth-anim auth-anim-d3">
            <label className="auth-label">Password</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon material-symbols-rounded">lock</span>
              <input className={`auth-input ${errors.password ? 'err' : ''}`} type={showPwd ? 'text' : 'password'} placeholder="At least 8 characters"
                value={form.password} onChange={e => set('password', e.target.value)} />
              <button type="button" className="auth-pwd-toggle" onClick={() => setShowPwd(s => !s)}>
                <span className="material-symbols-rounded">{showPwd ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            {errors.password && <div className="auth-err"><span className="material-symbols-rounded" style={{fontSize:13}}>error</span>{errors.password}</div>}
          </div>

          <div className="auth-field auth-anim auth-anim-d3">
            <label className="auth-label">Confirm password</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon material-symbols-rounded">lock</span>
              <input className={`auth-input ${errors.confirmPassword ? 'err' : ''}`} type={showConfirmPwd ? 'text' : 'password'} placeholder="Re-enter your password"
                value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} />
              <button type="button" className="auth-pwd-toggle" onClick={() => setShowConfirmPwd(s => !s)}>
                <span className="material-symbols-rounded">{showConfirmPwd ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            {errors.confirmPassword && <div className="auth-err"><span className="material-symbols-rounded" style={{fontSize:13}}>error</span>{errors.confirmPassword}</div>}
          </div>

          <div className="auth-field auth-anim auth-anim-d3">
            <label className="auth-label">Location (optional)</label>
            <input className="auth-input" placeholder="e.g. Kigali, Rwanda"
              value={form.location} onChange={e => set('location', e.target.value)} />
          </div>

          <div className="auth-field auth-anim auth-anim-d3">
            <label className="auth-label">Student email domain (optional)</label>
            <input className={`auth-input ${errors.student_email_domain ? 'err' : ''}`} placeholder="e.g. alustudent.com"
              value={form.student_email_domain} onChange={e => set('student_email_domain', e.target.value)} />
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6, lineHeight: 1.5 }}>
              Lets you mark listings as <strong>visible to your students only</strong>. Students whose login email ends in this domain (e.g. <code>@alustudent.com</code>) will see those listings.
            </div>
            {errors.student_email_domain && <div className="auth-err"><span className="material-symbols-rounded" style={{fontSize:13}}>error</span>{errors.student_email_domain}</div>}
          </div>

          <div className="auth-field">
            <label style={{display:'flex',alignItems:'flex-start',gap:10,cursor:'pointer'}}>
              <input type="checkbox" checked={form.agreed} onChange={e=>set('agreed',e.target.checked)} style={{marginTop:3,width:15,height:15,accentColor:'#0A2E5C',flexShrink:0,cursor:'pointer'}}/>
              <span style={{fontSize:12,color:'#6b7280',lineHeight:1.65}}>
                I agree to the{' '}
                <span className="link" style={{color:'#0A2E5C',fontWeight:600}} onClick={e=>{e.preventDefault();setShowPrivacy(true);}}>Privacy Policy & Terms of Service</span>.
                {' '}School accounts may only post genuine opportunities. Student data accessed through ALUHub may not be used for any purpose other than recruitment.
              </span>
            </label>
            {errors.agreed && <div className="auth-err" style={{marginTop:6}}><span className="material-symbols-rounded" style={{fontSize:13}}>error</span>{errors.agreed}</div>}
          </div>

          <button className="auth-btn auth-btn-primary auth-anim auth-anim-d4" disabled={loading} onClick={submit}>
            {loading ? 'Creating account…' : 'Create school account →'}
          </button>

          <div className="auth-switch auth-anim auth-anim-d4" style={{ marginTop: 14 }}>
            <span className="link" onClick={onBack}>← Back</span>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <AuthRight userType="company" />
      </div>
      {showPrivacy && <PrivacyPolicyModal onClose={()=>setShowPrivacy(false)}/>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  LOGIN SCREEN  — supports both student and company accounts
// ══════════════════════════════════════════════════════════════════
function LoginScreen({ onDone, onBack, onForgot }) {
  const [form, setForm] = useState({ email: '', password: '' });
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
    if (window.__npStart) window.__npStart();
    const { data, error } = await signIn(form.email, form.password);
    if (error) { setErrors({ password: error.message }); setLoading(false); if (window.__npDone) window.__npDone(); return; }
    const profile = data?.user ? await getProfile(data.user.id) : null;
    setLoading(false);
    if (window.__npDone) window.__npDone();
    onDone({ user: data?.user, profile, form: { name: profile?.full_name || '', email: form.email }, userType: profile?.user_type || 'student' });
  }

  return (
    <div className="auth-shell">
      <div className="auth-left">
        <div className="auth-logo">
          <div className="auth-logo-mark"><img src="/logo.svg" alt="ALUHub"/></div>
          <div className="auth-logo-text">ALU<span>Hub</span></div>
        </div>

        <div className="auth-form-wrap">
          {/* Sign Up / Log In tabs */}
          <div style={{display:'flex',gap:8,marginBottom:24}}>
            <button onClick={onBack} style={{flex:1,padding:'10px 0',fontWeight:700,fontSize:14,background:'transparent',color:'var(--text2)',border:'2px solid var(--border)',borderRadius:10,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Sign Up</button>
            <button style={{flex:1,padding:'10px 0',fontWeight:700,fontSize:14,background:'#0A2E5C',color:'#fff',border:'2px solid #0A2E5C',borderRadius:10,cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Log In</button>
          </div>

          <div className="auth-heading auth-anim">Welcome back</div>
          <div className="auth-sub auth-anim auth-anim-d1" style={{marginBottom:18}}>
            Sign in to your ALU Hub account.
          </div>

          <div className="auth-field auth-anim auth-anim-d1">
            <label className="auth-label">Email</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon material-symbols-rounded">mail</span>
              <input className={`auth-input ${errors.email ? 'err' : ''}`} type="email"
                placeholder="you@example.com" autoComplete="email"
                value={form.email} onChange={e => set('email', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()} autoFocus />
            </div>
            {errors.email && <div className="auth-err"><span className="material-symbols-rounded" style={{fontSize:13}}>error</span>{errors.email}</div>}
          </div>

          <div className="auth-field auth-anim auth-anim-d2">
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
              <label className="auth-label" style={{marginBottom:0}}>Password</label>
              <span className="link" style={{fontSize:12,color:'#2563EB',fontWeight:600}} onClick={onForgot}>Forgot password?</span>
            </div>
            <div className="auth-input-wrap">
              <span className="auth-input-icon material-symbols-rounded">lock</span>
              <input className={`auth-input ${errors.password ? 'err' : ''}`}
                type={showPwd ? 'text' : 'password'} placeholder="Your password"
                autoComplete="current-password"
                value={form.password} onChange={e => set('password', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()} />
              <button className="auth-pwd-toggle" type="button" onClick={() => setShowPwd(s => !s)}>
                <span className="material-symbols-rounded">{showPwd ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            {errors.password && <div className="auth-err"><span className="material-symbols-rounded" style={{fontSize:13}}>error</span>{errors.password}</div>}
          </div>

          <button className="auth-btn auth-btn-primary" onClick={submit} disabled={loading}>
            {loading ? <><span className="auth-btn-spinner"/>Logging in…</> : 'Log In →'}
          </button>
        </div>
      </div>

      <div className="auth-right">
        <AuthRight userType="student" />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  FORGOT PASSWORD SCREEN
// ══════════════════════════════════════════════════════════════════
function ForgotPasswordScreen({ onBack }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');

  async function submit() {
    setErr('');
    if (!validateEmail(email.trim())) { setErr('Enter your account email address'); return; }
    setLoading(true);
    await requestPasswordReset(email.trim());
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="auth-shell">
      <div className="auth-left">
        <div className="auth-logo">
          <div className="auth-logo-mark"><img src="/logo.svg" alt="ALUHub"/></div>
          <div className="auth-logo-text">ALU<span>Hub</span></div>
        </div>
        <div className="auth-form-wrap">
          <div className="auth-eyebrow">Password reset</div>
          <div className="auth-heading auth-anim">Forgot your password?</div>
          {sent ? (
            <div style={{marginTop:18}}>
              <div style={{padding:'16px 18px',background:'rgba(16,185,129,.08)',border:'1px solid rgba(16,185,129,.3)',borderRadius:12,marginBottom:20}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
                  <span className="material-symbols-rounded" style={{fontSize:22,color:'#059669',fontVariationSettings:"'FILL' 1"}}>mark_email_read</span>
                  <div style={{fontWeight:700,fontSize:14,color:'#065F46'}}>Check your inbox</div>
                </div>
                <div style={{fontSize:13,color:'#065F46',lineHeight:1.65}}>
                  If <strong>{email.trim()}</strong> is registered, we've sent a password reset link. It expires in 60 minutes.
                </div>
              </div>
              <div style={{fontSize:12.5,color:'var(--text3)',lineHeight:1.6,marginBottom:18}}>
                Didn't get an email? Check your spam folder, or{' '}
                <span className="link" style={{color:'#2563EB'}} onClick={()=>setSent(false)}>try again</span>.
              </div>
              <button className="auth-btn auth-btn-primary" onClick={onBack}>← Back to sign in</button>
            </div>
          ) : (
            <>
              <div className="auth-sub auth-anim auth-anim-d1">
                Enter your account email and we'll send you a link to reset your password.
              </div>
              <div className="auth-field auth-anim auth-anim-d1" style={{marginTop:18}}>
                <label className="auth-label">Email address</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon material-symbols-rounded">mail</span>
                  <input className={`auth-input ${err ? 'err' : ''}`} type="email"
                    placeholder="you@example.com" value={email}
                    onChange={e=>setEmail(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&submit()} autoFocus />
                </div>
                {err && <div className="auth-err"><span className="material-symbols-rounded" style={{fontSize:13}}>error</span>{err}</div>}
              </div>
              <button className="auth-btn auth-btn-primary" onClick={submit} disabled={loading} style={{marginTop:8}}>
                {loading ? <><span className="auth-btn-spinner"/>Sending…</> : 'Send reset link →'}
              </button>
              <div className="auth-switch" style={{marginTop:16}}>
                <span className="link" onClick={onBack}>← Back to sign in</span>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="auth-right">
        <AuthRight userType="student" />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  RESET PASSWORD SCREEN  (shown when ?reset_token= is in URL)
// ══════════════════════════════════════════════════════════════════
function ResetPasswordScreen({ token, onDone }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState(false);

  async function submit() {
    setErr('');
    if (password.length < 8) { setErr('Password must be at least 8 characters'); return; }
    if (password !== confirm) { setErr('Passwords do not match'); return; }
    setLoading(true);
    const { error } = await resetPassword(token, password);
    setLoading(false);
    if (error) { setErr(error.message || 'Reset failed — the link may have expired'); return; }
    setSuccess(true);
  }

  if (success) return (
    <div className="auth-shell">
      <div className="auth-left">
        <div className="auth-logo">
          <div className="auth-logo-mark"><img src="/logo.svg" alt="ALUHub"/></div>
          <div className="auth-logo-text">ALU<span>Hub</span></div>
        </div>
        <div className="auth-form-wrap">
          <div style={{textAlign:'center',padding:'30px 0'}}>
            <span className="material-symbols-rounded" style={{fontSize:52,color:'#059669',fontVariationSettings:"'FILL' 1"}}>check_circle</span>
            <div style={{fontWeight:800,fontSize:20,color:'var(--text)',marginTop:12,marginBottom:8,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Password updated!</div>
            <div style={{fontSize:13.5,color:'var(--text2)',lineHeight:1.65,marginBottom:24}}>Your password has been changed. You've been signed out of all other devices for security.</div>
            <button className="auth-btn auth-btn-primary" onClick={onDone}>Sign in with new password →</button>
          </div>
        </div>
      </div>
      <div className="auth-right"><AuthRight userType="student"/></div>
    </div>
  );

  return (
    <div className="auth-shell">
      <div className="auth-left">
        <div className="auth-logo">
          <div className="auth-logo-mark"><img src="/logo.svg" alt="ALUHub"/></div>
          <div className="auth-logo-text">ALU<span>Hub</span></div>
        </div>
        <div className="auth-form-wrap">
          <div className="auth-eyebrow">Password reset</div>
          <div className="auth-heading auth-anim">Set a new password</div>
          <div className="auth-sub auth-anim auth-anim-d1">Choose a strong password you haven't used before.</div>

          <div className="auth-field auth-anim auth-anim-d1" style={{marginTop:18}}>
            <label className="auth-label">New password</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon material-symbols-rounded">lock</span>
              <input className={`auth-input ${err ? 'err' : ''}`}
                type={showPwd ? 'text' : 'password'} placeholder="At least 8 characters"
                value={password} onChange={e=>setPassword(e.target.value)} autoFocus />
              <button className="auth-pwd-toggle" type="button" onClick={()=>setShowPwd(s=>!s)}>
                <span className="material-symbols-rounded">{showPwd ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>

          <div className="auth-field auth-anim auth-anim-d2">
            <label className="auth-label">Confirm new password</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon material-symbols-rounded">lock</span>
              <input className={`auth-input ${err ? 'err' : ''}`}
                type={showPwd ? 'text' : 'password'} placeholder="Same password again"
                value={confirm} onChange={e=>setConfirm(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&submit()} />
            </div>
            {err && <div className="auth-err"><span className="material-symbols-rounded" style={{fontSize:13}}>error</span>{err}</div>}
          </div>

          {password.length > 0 && (
            <div style={{display:'flex',gap:4,marginBottom:8}}>
              {[password.length>=8, /[A-Z]/.test(password), /[0-9]/.test(password)].map((ok,i)=>(
                <div key={i} style={{height:3,flex:1,borderRadius:2,background:ok?'#059669':'var(--border)',transition:'background .2s'}}/>
              ))}
            </div>
          )}

          <button className="auth-btn auth-btn-primary" onClick={submit} disabled={loading}>
            {loading ? <><span className="auth-btn-spinner"/>Updating…</> : 'Set new password →'}
          </button>
        </div>
      </div>
      <div className="auth-right"><AuthRight userType="student"/></div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  AUTH ROUTER — orchestrates the full flow
// ══════════════════════════════════════════════════════════════════
function AuthRouter({ onAuthComplete }) {
  const [step, setStep] = useState(() => window.__ALUHUB_RESET_TOKEN ? 'reset' : 'type');

  function handleTypeSelect(type) {
    if (type === 'login') { setStep('login'); return; }
    setStep(type); // 'student' | 'company' | 'school'
  }

  function handleSignupDone(data) {
    onAuthComplete(data);
  }

  function handleLoginDone(data) {
    onAuthComplete(data);
  }

  if (step === 'type') return <StepUserType onSelect={handleTypeSelect} />;
  if (step === 'student') return <StepStudentSignup onDone={handleSignupDone} onBack={() => setStep('type')} />;
  if (step === 'company') return <StepCompanySignup onDone={handleSignupDone} onBack={() => setStep('type')} />;
  if (step === 'school') return <StepSchoolSignup onDone={handleSignupDone} onBack={() => setStep('type')} />;
  if (step === 'login') return <LoginScreen onDone={handleLoginDone} onBack={() => setStep('type')} onForgot={() => setStep('forgot')} />;
  if (step === 'forgot') return <ForgotPasswordScreen onBack={() => setStep('login')} />;
  if (step === 'reset') return <ResetPasswordScreen token={window.__ALUHUB_RESET_TOKEN} onDone={() => { window.__ALUHUB_RESET_TOKEN = null; setStep('login'); }} />;
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

  // Bridge from the non-React refresh path: when refreshSession() fails
  // (refresh cookie expired or rejected), it calls this to flip the app
  // back to the login screen.
  useEffect(() => {
    window.__forceAuthRedirect = (message) => {
      if (typeof window.__pushUnregisterDeviceToken === 'function') {
        try { window.__pushUnregisterDeviceToken(); } catch (_) {}
      }
      setCurrentUser(null);
      setAuthState('unauthenticated');
      if (message) { try { toast(message); } catch (_) {} }
    };
    return () => { try { delete window.__forceAuthRedirect; } catch (_) {} };
  }, []);

  async function checkSession() {
    if (window.__npStart) window.__npStart();
    const session = await getSession();
    if (session?.user) {
      const profile = await getProfile(session.user.id);
      setCurrentUser({ user: session.user, profile, userType: profile?.user_type || 'student', form: { name: profile?.full_name, email: session.user.email } });
      setAuthState('authenticated');

      // Register for web push notifications (PWA) on return visits
      window.__ALU_USER_ID = session.user.id;
      const apiUrl = __ENV.API_URL || 'http://localhost:4000';
      if (typeof window.__registerWebPush === 'function') {
        window.__registerWebPush(apiUrl, session.user.id).catch(err => console.warn('[Auth] Web push registration failed:', err));
      }
    } else {
      setAuthState('unauthenticated');
    }
    if (window.__npDone) window.__npDone();
  }

  function handleAuthComplete(data) {
    setCurrentUser(data);
    setAuthState('authenticated');
    toast(`Welcome to ALU Hub, ${data.form?.name?.split(' ')[0] || 'friend'}! 🎉`);

    // Register for web push notifications (PWA)
    if (data.user?.id) {
      window.__ALU_USER_ID = data.user.id;
      const apiUrl = __ENV.API_URL || 'http://localhost:4000';
      if (typeof window.__registerWebPush === 'function') {
        window.__registerWebPush(apiUrl, data.user.id).catch(err => console.warn('[Auth] Web push registration failed:', err));
      }
    }
  }

  function handleSignOut() {
    // Tell the backend to drop this device's push token first, so the
    // previous account stops getting pushes here.
    if (typeof window.__pushUnregisterDeviceToken === 'function') {
      try { window.__pushUnregisterDeviceToken(); } catch (_) {}
    }
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 18, background: 'var(--bg)' }}>
        <TopProgressBar />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="auth-logo-mark" style={{ width: 54, height: 54, borderRadius: 15 }}>
            <img src="/logo.svg" alt="ALUHub" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
          </div>
          <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 20, color: 'var(--text)', letterSpacing: '-.04em' }}>
            ALU<span style={{ color: '#2563EB' }}>Hub</span>
          </div>
          <div className="pay-spinner" style={{ width: 28, height: 28, borderWidth: 2.5 }} />
        </div>
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return <>{React.createElement(TopProgressBar)}<AuthRouter onAuthComplete={handleAuthComplete} /></>;
  }

  // ── Authenticated: hand off to the main App (defined in ALUHub.js which loads first) ──
  async function handleChangeEmail(newEmail, currentPassword) {
    const { data, error } = await changeEmail(newEmail, currentPassword);
    if (error) return { error };
    setCurrentUser(u => u ? { ...u, user: { ...u.user, email: data.email }, form: { ...u.form, email: data.email } } : u);
    return { data };
  }

  async function handleDeleteAccount(currentPassword) {
    const { error } = await deleteAccount(currentPassword);
    if (error) return { error };
    if (typeof window.__pushUnregisterDeviceToken === 'function') {
      try { window.__pushUnregisterDeviceToken(); } catch (_) {}
    }
    setCurrentUser(null);
    setAuthState('unauthenticated');
    return { data: { ok: true } };
  }

  return <>{React.createElement(TopProgressBar)}<App user={currentUser} onSignOut={handleSignOut} onChangeEmail={handleChangeEmail} onDeleteAccount={handleDeleteAccount} /></>;
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
  school text,                    -- ALU
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
