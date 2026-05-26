import type { Request, Response, NextFunction } from 'express';
import { verifySupabaseJwt, type DecodedSupabaseJwt } from '../lib/supabase-jwt.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: DecodedSupabaseJwt;
    }
  }
}

/** Rejects the request unless it carries a valid, unexpired access token. */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing access token' });
    return;
  }
  try {
    req.user = verifySupabaseJwt(header.slice('Bearer '.length));
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired access token' });
  }
}
