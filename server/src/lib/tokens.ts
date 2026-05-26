import crypto from 'node:crypto';
import { env } from '../config/env.js';

/** Opaque, high-entropy refresh token. The raw value is shown to the
 *  client once; only its hash is ever stored. */
export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function refreshTokenExpiry(): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + env.REFRESH_TOKEN_TTL_DAYS);
  return expiry;
}
