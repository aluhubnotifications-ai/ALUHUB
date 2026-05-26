import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Mints a Supabase-compatible JWT signed with the project's JWT secret.
 * PostgREST and Realtime both verify any HS256 JWT signed with that
 * secret, so all existing RLS policies that use auth.uid() / auth.role()
 * keep working even though we are no longer using gotrue.
 *
 * We include every claim Supabase Auth normally sets, even the ones
 * RLS doesn't reference, because some Realtime / Storage features
 * silently filter rows when claims like email_confirmed_at are absent.
 * email_confirmed_at is always populated (we don't gate access on it)
 * so no Supabase-internal check ever marks our users as unverified.
 */
export interface SupabaseClaims {
  sub: string;
  email: string;
}

export function signSupabaseJwt(claims: SupabaseClaims): string {
  const nowIso = new Date().toISOString();
  const payload = {
    sub: claims.sub,
    email: claims.email,
    role: 'authenticated',
    aud: 'authenticated',
    iss: `${env.SUPABASE_URL}/auth/v1`,
    // Mark the user as fully verified so no Supabase feature
    // (Realtime row filtering, Storage policies, etc.) treats them
    // as a half-onboarded account. Our backend decides verification
    // semantics; the JWT must not be the gatekeeper.
    email_confirmed_at: nowIso,
    phone_confirmed_at: nowIso,
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {},
    aal: 'aal1',
    amr: [{ method: 'password', timestamp: Math.floor(Date.now() / 1000) }],
    is_anonymous: false,
  };
  const options: SignOptions = {
    algorithm: 'HS256',
    expiresIn: env.ACCESS_TOKEN_TTL as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.SUPABASE_JWT_SECRET, options);
}

export interface DecodedSupabaseJwt {
  sub: string;
  email: string;
  role: string;
}

export function verifySupabaseJwt(token: string): DecodedSupabaseJwt {
  const decoded = jwt.verify(token, env.SUPABASE_JWT_SECRET, {
    algorithms: ['HS256'],
    audience: 'authenticated',
  });
  if (typeof decoded === 'string') throw new Error('Malformed JWT');
  const { sub, email, role } = decoded as Record<string, unknown>;
  if (typeof sub !== 'string' || typeof email !== 'string' || typeof role !== 'string') {
    throw new Error('JWT missing required claims');
  }
  return { sub, email, role };
}
