import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

const noPersist = { auth: { autoRefreshToken: false, persistSession: false } };

// Service-role client — full access. Backend only, never sent to the browser.
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  noPersist,
);

// Anon client — used only to verify user credentials during login.
export const supabaseAnon = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  noPersist,
);
