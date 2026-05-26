import bcrypt from 'bcrypt';
import crypto from 'node:crypto';

const ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? '12');

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

export function generateEmailToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

export function hashEmailToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}
