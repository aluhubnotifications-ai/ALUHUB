import { Router, type Request, type Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { env, isProduction } from '../config/env.js';
import {
  generateRefreshToken,
  hashToken,
  refreshTokenExpiry,
} from '../lib/tokens.js';
import { signSupabaseJwt } from '../lib/supabase-jwt.js';
import {
  hashPassword,
  verifyPassword,
  generateEmailToken,
  hashEmailToken,
} from '../lib/passwords.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../lib/auth-email.js';
import { requireAuth } from '../middleware/auth.js';

export const authRouter = Router();

const REFRESH_COOKIE = 'aluhub_refresh';
const REFRESH_TABLE = 'auth_refresh_tokens';
const USERS_TABLE = 'app_users';

const MAX_FAILED_ATTEMPTS = 8;
const LOCKOUT_MINUTES = 15;
const VERIFY_TOKEN_TTL_HOURS = 24;
const RESET_TOKEN_TTL_MINUTES = 60;

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
  path: '/api/auth',
  maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
};

interface SessionUser {
  id: string;
  email: string;
  role: string;
}

interface AppUserRow {
  id: string;
  email: string;
  password_hash: string;
  email_verified_at: string | null;
  failed_attempts: number;
  locked_until: string | null;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Issues a fresh access token (Supabase-compatible) and a fresh refresh
 * token. The refresh token is stored hashed; the raw value is returned
 * to the client (cookie for web, JSON for native) exactly once.
 *
 * The access token is signed with SUPABASE_JWT_SECRET so that PostgREST
 * accepts it and existing RLS policies (auth.uid() = id) still work —
 * we are off gotrue but the database layer is unchanged.
 */
async function issueTokens(res: Response, user: SessionUser): Promise<string> {
  const accessToken = signSupabaseJwt({ sub: user.id, email: user.email });
  const refreshToken = generateRefreshToken();

  const { error } = await supabaseAdmin.from(REFRESH_TABLE).insert({
    user_id: user.id,
    token_hash: hashToken(refreshToken),
    expires_at: refreshTokenExpiry().toISOString(),
  });
  if (error) throw new Error(`Could not persist refresh token: ${error.message}`);

  // Self-heal: guarantee a profiles row with id = app_users.id exists.
  // Without this, RLS on direct_messages ("auth.uid() = sender_id" with
  // sender_id REFERENCES profiles(id)) rejects every DM insert/select
  // when a user's profile.id drifted from their app_users.id — which
  // happens to users created before the custom-auth migration or to
  // re-registered accounts where the old profile row was orphaned.
  await ensureProfile(user.id);

  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
  res.locals.refreshToken = refreshToken;
  return accessToken;
}

async function ensureProfile(userId: string): Promise<void> {
  // upsert with onConflict: 'id' is a no-op when the row already exists.
  // Fire-and-forget on error: we never want a profile hiccup to break
  // login, and the error is logged for ops.
  const { error } = await supabaseAdmin
    .from('profiles')
    .upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true });
  if (error) {
    console.error(`[auth] ensureProfile(${userId}) failed:`, error.message);
  }
}

function readRefreshToken(req: Request): string | null {
  const fromCookie = req.cookies?.[REFRESH_COOKIE];
  if (typeof fromCookie === 'string' && fromCookie) return fromCookie;
  const fromBody = req.body?.refreshToken;
  if (typeof fromBody === 'string' && fromBody) return fromBody;
  return null;
}

async function findUserByEmail(email: string): Promise<AppUserRow | null> {
  const { data } = await supabaseAdmin
    .from(USERS_TABLE)
    .select('id, email, password_hash, email_verified_at, failed_attempts, locked_until')
    .ilike('email', email)
    .maybeSingle();
  return (data as AppUserRow | null) ?? null;
}

// ── POST /api/auth/register ────────────────────────────────────────
authRouter.post('/register', async (req: Request, res: Response) => {
  const { email: rawEmail, password, metadata } = req.body ?? {};
  if (typeof rawEmail !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'email and password are required' });
  }
  const email = normalizeEmail(rawEmail);
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'An account with that email already exists' });
  }

  const passwordHash = await hashPassword(password);
  const { raw: verifyToken, hash: verifyHash } = generateEmailToken();
  const verifyExpires = new Date(Date.now() + VERIFY_TOKEN_TTL_HOURS * 60 * 60 * 1000);

  const { data, error } = await supabaseAdmin
    .from(USERS_TABLE)
    .insert({
      email,
      password_hash: passwordHash,
      verification_token_hash: verifyHash,
      verification_expires_at: verifyExpires.toISOString(),
    })
    .select('id, email')
    .single();
  if (error || !data) {
    return res.status(500).json({ error: error?.message ?? 'Could not create user' });
  }

  // Profile row uses the same UUID so existing RLS (auth.uid() = id) works.
  if (metadata && typeof metadata === 'object') {
    await supabaseAdmin.from('profiles').upsert({ id: data.id, ...metadata });
  }

  // Fire-and-forget: Brevo's API can take several seconds and registration
  // should not block on it. The user can request a resend if the mail never
  // arrives.
  sendVerificationEmail(email, verifyToken).catch((e) => {
    console.error('[auth] verification email failed:', e);
  });

  const user: SessionUser = { id: data.id, email: data.email, role: 'authenticated' };
  const accessToken = await issueTokens(res, user);
  return res.status(201).json({
    accessToken,
    refreshToken: res.locals.refreshToken,
    user: { ...user, emailVerified: false },
  });
});

// ── POST /api/auth/verify-email ────────────────────────────────────
authRouter.post('/verify-email', async (req: Request, res: Response) => {
  const { token } = req.body ?? {};
  if (typeof token !== 'string' || !token) {
    return res.status(400).json({ error: 'token is required' });
  }
  const tokenHash = hashEmailToken(token);
  const { data: row } = await supabaseAdmin
    .from(USERS_TABLE)
    .select('id, email, verification_expires_at')
    .eq('verification_token_hash', tokenHash)
    .maybeSingle();

  if (!row) {
    return res.status(400).json({ error: 'Invalid or expired verification link' });
  }
  if (row.verification_expires_at && new Date(row.verification_expires_at).getTime() < Date.now()) {
    return res.status(400).json({ error: 'Verification link expired' });
  }

  await supabaseAdmin
    .from(USERS_TABLE)
    .update({
      email_verified_at: new Date().toISOString(),
      verification_token_hash: null,
      verification_expires_at: null,
    })
    .eq('id', row.id);

  return res.json({ ok: true, email: row.email });
});

// ── POST /api/auth/resend-verification ─────────────────────────────
authRouter.post('/resend-verification', async (req: Request, res: Response) => {
  const { email: rawEmail } = req.body ?? {};
  if (typeof rawEmail !== 'string') {
    return res.status(400).json({ error: 'email is required' });
  }
  const email = normalizeEmail(rawEmail);
  const existing = await findUserByEmail(email);
  // Always 200 to avoid leaking which emails are registered.
  if (!existing || existing.email_verified_at) {
    return res.json({ ok: true });
  }

  const { raw: verifyToken, hash: verifyHash } = generateEmailToken();
  const verifyExpires = new Date(Date.now() + VERIFY_TOKEN_TTL_HOURS * 60 * 60 * 1000);
  await supabaseAdmin
    .from(USERS_TABLE)
    .update({
      verification_token_hash: verifyHash,
      verification_expires_at: verifyExpires.toISOString(),
    })
    .eq('id', existing.id);

  sendVerificationEmail(email, verifyToken).catch((e) => {
    console.error('[auth] resend verification email failed:', e);
  });
  return res.json({ ok: true });
});

// ── POST /api/auth/login ───────────────────────────────────────────
authRouter.post('/login', async (req: Request, res: Response) => {
  const { email: rawEmail, password } = req.body ?? {};
  if (typeof rawEmail !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'email and password are required' });
  }
  const email = normalizeEmail(rawEmail);
  const user = await findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
    return res.status(423).json({ error: 'Account temporarily locked. Try again later.' });
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    const failed = user.failed_attempts + 1;
    const update: Record<string, unknown> = { failed_attempts: failed };
    if (failed >= MAX_FAILED_ATTEMPTS) {
      update.locked_until = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString();
      update.failed_attempts = 0;
    }
    await supabaseAdmin.from(USERS_TABLE).update(update).eq('id', user.id);
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (user.failed_attempts !== 0 || user.locked_until) {
    await supabaseAdmin
      .from(USERS_TABLE)
      .update({ failed_attempts: 0, locked_until: null })
      .eq('id', user.id);
  }

  const sessionUser: SessionUser = { id: user.id, email: user.email, role: 'authenticated' };
  const accessToken = await issueTokens(res, sessionUser);
  return res.json({
    accessToken,
    refreshToken: res.locals.refreshToken,
    user: { ...sessionUser, emailVerified: Boolean(user.email_verified_at) },
  });
});

// ── POST /api/auth/refresh ─────────────────────────────────────────
// Rotation: the presented refresh token is consumed (revoked) and a brand
// new pair is issued. A revoked token presented again is treated as theft —
// every refresh token for that user is invalidated.
authRouter.post('/refresh', async (req: Request, res: Response) => {
  const presented = readRefreshToken(req);
  if (!presented) {
    return res.status(401).json({ error: 'Missing refresh token' });
  }

  const tokenHash = hashToken(presented);
  const { data: row } = await supabaseAdmin
    .from(REFRESH_TABLE)
    .select('id, user_id, expires_at, revoked')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (!row) {
    res.clearCookie(REFRESH_COOKIE, cookieOptions);
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  if (row.revoked) {
    await supabaseAdmin
      .from(REFRESH_TABLE)
      .update({ revoked: true })
      .eq('user_id', row.user_id);
    res.clearCookie(REFRESH_COOKIE, cookieOptions);
    return res.status(401).json({ error: 'Refresh token reuse detected' });
  }

  if (new Date(row.expires_at).getTime() < Date.now()) {
    res.clearCookie(REFRESH_COOKIE, cookieOptions);
    return res.status(401).json({ error: 'Refresh token expired' });
  }

  await supabaseAdmin
    .from(REFRESH_TABLE)
    .update({ revoked: true })
    .eq('id', row.id);

  const { data: userData } = await supabaseAdmin
    .from(USERS_TABLE)
    .select('id, email, email_verified_at')
    .eq('id', row.user_id)
    .maybeSingle();
  if (!userData) {
    res.clearCookie(REFRESH_COOKIE, cookieOptions);
    return res.status(401).json({ error: 'User no longer exists' });
  }

  const sessionUser: SessionUser = { id: userData.id, email: userData.email, role: 'authenticated' };
  const accessToken = await issueTokens(res, sessionUser);
  return res.json({
    accessToken,
    refreshToken: res.locals.refreshToken,
    user: { ...sessionUser, emailVerified: Boolean(userData.email_verified_at) },
  });
});

// ── POST /api/auth/logout ──────────────────────────────────────────
authRouter.post('/logout', async (req: Request, res: Response) => {
  const presented = readRefreshToken(req);
  if (presented) {
    await supabaseAdmin
      .from(REFRESH_TABLE)
      .update({ revoked: true })
      .eq('token_hash', hashToken(presented));
  }
  res.clearCookie(REFRESH_COOKIE, cookieOptions);
  return res.json({ ok: true });
});

// ── POST /api/auth/request-password-reset ──────────────────────────
authRouter.post('/request-password-reset', async (req: Request, res: Response) => {
  const { email: rawEmail } = req.body ?? {};
  if (typeof rawEmail !== 'string') {
    return res.status(400).json({ error: 'email is required' });
  }
  const email = normalizeEmail(rawEmail);
  const existing = await findUserByEmail(email);
  // Always 200 to avoid leaking which emails are registered.
  if (!existing) {
    return res.json({ ok: true });
  }
  const { raw: resetToken, hash: resetHash } = generateEmailToken();
  const expires = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);
  await supabaseAdmin
    .from(USERS_TABLE)
    .update({
      password_reset_hash: resetHash,
      password_reset_expires_at: expires.toISOString(),
    })
    .eq('id', existing.id);
  sendPasswordResetEmail(email, resetToken).catch((e) => {
    console.error('[auth] password reset email failed:', e);
  });
  return res.json({ ok: true });
});

// ── POST /api/auth/reset-password ──────────────────────────────────
authRouter.post('/reset-password', async (req: Request, res: Response) => {
  const { token, password } = req.body ?? {};
  if (typeof token !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'token and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  const tokenHash = hashEmailToken(token);
  const { data: row } = await supabaseAdmin
    .from(USERS_TABLE)
    .select('id, password_reset_expires_at')
    .eq('password_reset_hash', tokenHash)
    .maybeSingle();
  if (!row) {
    return res.status(400).json({ error: 'Invalid or expired reset link' });
  }
  if (row.password_reset_expires_at && new Date(row.password_reset_expires_at).getTime() < Date.now()) {
    return res.status(400).json({ error: 'Reset link expired' });
  }
  const passwordHash = await hashPassword(password);
  await supabaseAdmin
    .from(USERS_TABLE)
    .update({
      password_hash: passwordHash,
      password_reset_hash: null,
      password_reset_expires_at: null,
      failed_attempts: 0,
      locked_until: null,
    })
    .eq('id', row.id);
  // Revoke all refresh tokens for this user — force re-login everywhere.
  await supabaseAdmin
    .from(REFRESH_TABLE)
    .update({ revoked: true })
    .eq('user_id', row.id);
  return res.json({ ok: true });
});

// ── GET /api/auth/me ───────────────────────────────────────────────
authRouter.get('/me', requireAuth, (req: Request, res: Response) => {
  return res.json({ user: req.user });
});

// ── POST /api/auth/change-email ────────────────────────────────────
// Requires the caller's CURRENT password (so a stolen access token
// can't silently take over the account by swapping its email).
authRouter.post('/change-email', requireAuth, async (req: Request, res: Response) => {
  const { newEmail: rawEmail, currentPassword } = req.body ?? {};
  if (typeof rawEmail !== 'string' || typeof currentPassword !== 'string') {
    return res.status(400).json({ error: 'newEmail and currentPassword are required' });
  }
  const newEmail = normalizeEmail(rawEmail);
  if (!isValidEmail(newEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }

  const uid = req.user!.sub;
  const { data: row } = await supabaseAdmin
    .from(USERS_TABLE)
    .select('id, email, password_hash')
    .eq('id', uid)
    .maybeSingle();
  if (!row) return res.status(404).json({ error: 'Account not found' });

  const ok = await verifyPassword(currentPassword, (row as AppUserRow).password_hash);
  if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });

  if (newEmail === (row as AppUserRow).email) {
    return res.status(400).json({ error: 'That is already your email address' });
  }

  // Check the new email isn't already in use.
  const existing = await findUserByEmail(newEmail);
  if (existing) return res.status(409).json({ error: 'That email is already registered to another account' });

  const { error } = await supabaseAdmin
    .from(USERS_TABLE)
    .update({ email: newEmail, email_verified_at: null })
    .eq('id', uid);
  if (error) {
    console.error('[auth/change-email] update failed:', error.message);
    return res.status(500).json({ error: 'Could not change email — please try again' });
  }

  return res.json({ ok: true, email: newEmail });
});

// ── POST /api/auth/change-password ─────────────────────────────────
// Requires the caller's CURRENT password plus a new password (≥ 8 chars).
// On success all other refresh tokens are revoked so hijacked sessions
// can no longer be used after a password change.
authRouter.post('/change-password', requireAuth, async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body ?? {};
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
    return res.status(400).json({ error: 'currentPassword and newPassword are required' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }
  if (currentPassword === newPassword) {
    return res.status(400).json({ error: 'New password must be different from your current password' });
  }

  const uid = req.user!.sub;
  const { data: row } = await supabaseAdmin
    .from(USERS_TABLE)
    .select('id, password_hash')
    .eq('id', uid)
    .maybeSingle();
  if (!row) return res.status(404).json({ error: 'Account not found' });

  const ok = await verifyPassword(currentPassword, (row as AppUserRow).password_hash);
  if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });

  const newHash = await hashPassword(newPassword);
  const { error } = await supabaseAdmin
    .from(USERS_TABLE)
    .update({ password_hash: newHash, failed_attempts: 0, locked_until: null })
    .eq('id', uid);
  if (error) {
    console.error('[auth/change-password] update failed:', error.message);
    return res.status(500).json({ error: 'Could not change password — please try again' });
  }

  // Revoke all OTHER refresh tokens so sessions on other devices must re-login.
  await supabaseAdmin.from(REFRESH_TABLE).update({ revoked: true }).eq('user_id', uid);

  return res.json({ ok: true });
});

// ── POST /api/auth/delete-account ──────────────────────────────────
// Requires current password to confirm intent. Wipes the user's data:
//   - all refresh tokens (sign out everywhere)
//   - the profiles row (cascade-deletes any FK-bound child rows)
//   - the app_users row (the account itself)
// Storage objects (avatar, CV) are best-effort cleaned by the client
// before calling this endpoint, since the storage SDK runs as the user.
authRouter.post('/delete-account', requireAuth, async (req: Request, res: Response) => {
  const { currentPassword, confirm } = req.body ?? {};
  if (typeof currentPassword !== 'string') {
    return res.status(400).json({ error: 'currentPassword is required' });
  }
  if (confirm !== 'DELETE') {
    return res.status(400).json({ error: 'Type DELETE to confirm account deletion' });
  }

  const uid = req.user!.sub;
  const { data: row } = await supabaseAdmin
    .from(USERS_TABLE)
    .select('id, password_hash')
    .eq('id', uid)
    .maybeSingle();
  if (!row) return res.status(404).json({ error: 'Account not found' });

  const ok = await verifyPassword(currentPassword, (row as AppUserRow).password_hash);
  if (!ok) return res.status(401).json({ error: 'Password is incorrect — deletion cancelled' });

  // Wipe everything tied to this user. Order matters: revoke tokens
  // first so any in-flight requests stop being authorised, then
  // explicitly clear tables that may not cascade (push_tokens used
  // to FK auth.users; ai_match_cache, follows etc. cascade via
  // profiles but we belt-and-brace clean anyway), then delete the
  // profile and the account itself.
  const cleanupTables: { table: string; col: string }[] = [
    { table: REFRESH_TABLE,        col: 'user_id' },
    { table: 'push_tokens',        col: 'user_id' },
    { table: 'ai_match_cache',     col: 'student_id' },
    { table: 'notifications',      col: 'user_id' },
    { table: 'direct_messages',    col: 'sender_id' },
    { table: 'direct_messages',    col: 'recipient_id' },
    { table: 'messages',           col: 'sender_id' },
    { table: 'applications',       col: 'student_id' },
    { table: 'housing_requests',   col: 'user_id' },
    { table: 'student_skills',     col: 'student_id' },
    { table: 'payments',           col: 'user_id' },
    { table: 'follows',            col: 'student_id' },
    { table: 'follows',            col: 'company_id' },
    { table: 'job_listings',       col: 'company_id' },
  ];
  for (const { table, col } of cleanupTables) {
    const { error } = await supabaseAdmin.from(table).delete().eq(col, uid);
    // Ignore "table not found" (42P01) and "column not found" (42703) —
    // schemas drift across environments and we don't want a missing
    // optional table to block the whole deletion.
    if (error && error.code !== '42P01' && error.code !== '42703') {
      console.warn(`[auth/delete-account] cleanup ${table}.${col} failed:`, error.message);
    }
  }

  const { error: profileErr } = await supabaseAdmin.from('profiles').delete().eq('id', uid);
  if (profileErr) {
    console.error('[auth/delete-account] profile delete failed:', profileErr.message, profileErr.code, profileErr.details);
    return res.status(500).json({ error: `Could not delete profile: ${profileErr.message}` });
  }

  const { error } = await supabaseAdmin.from(USERS_TABLE).delete().eq('id', uid);
  if (error) {
    console.error('[auth/delete-account] users delete failed:', error.message, error.code, error.details);
    return res.status(500).json({ error: `Account deletion failed: ${error.message}` });
  }

  // Clear the refresh cookie on the way out.
  res.clearCookie(REFRESH_COOKIE, cookieOptions);
  return res.json({ ok: true });
});

