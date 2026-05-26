import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function optional(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim() !== '' ? value.trim() : fallback;
}

export const env = {
  NODE_ENV: optional('NODE_ENV', 'development'),
  PORT: Number(optional('PORT', '4000')),
  CLIENT_ORIGINS: optional('CLIENT_ORIGINS', 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),

  SUPABASE_URL: required('SUPABASE_URL'),
  SUPABASE_ANON_KEY: required('SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: required('SUPABASE_SERVICE_ROLE_KEY'),
  // From Supabase Dashboard → Settings → API → JWT Settings → JWT Secret.
  // Used to sign our own access tokens so PostgREST/RLS honor them.
  SUPABASE_JWT_SECRET: required('SUPABASE_JWT_SECRET'),

  ACCESS_TOKEN_TTL: optional('ACCESS_TOKEN_TTL', '1h'),
  REFRESH_TOKEN_TTL_DAYS: Number(optional('REFRESH_TOKEN_TTL_DAYS', '30')),
  APP_URL: optional('APP_URL', 'http://localhost:5173'),

  ANTHROPIC_API_KEY: optional('ANTHROPIC_API_KEY', ''),

  BREVO_API_KEY:  optional('BREVO_API_KEY', ''),
  EMAIL_FROM_NAME: optional('EMAIL_FROM_NAME', 'ALUHub'),
  EMAIL_FROM_ADDR: optional('EMAIL_FROM_ADDR', 'noreply@aluhub.com'),

  // Firebase Cloud Messaging — used to fan a push out to a user's
  // registered Android devices when the server creates a notification.
  // FCM_SERVICE_ACCOUNT_PATH points at the Admin SDK JSON mounted as a
  // Render "secret file". Leave both empty to disable push fanout.
  FCM_PROJECT_ID:           optional('FCM_PROJECT_ID', ''),
  FCM_SERVICE_ACCOUNT_PATH: optional('FCM_SERVICE_ACCOUNT_PATH', ''),

  // Web Push (PWA) — VAPID keys for Web Push API notifications.
  // Generate with: node -e "const wp=require('web-push'); console.log(JSON.stringify(wp.generateVAPIDKeys()))"
  // Both keys are required for web push to work. Set them in Render env.
  VAPID_PUBLIC_KEY:  optional('VAPID_PUBLIC_KEY', 'BMyYawhNEw_EiE26_xOtyUxyWqZappamhlEAmOQYb7sHu9_K8vF5fmTeXRXXZKckEJG9wpLMaERmMID8SVKOMk4'),
  VAPID_PRIVATE_KEY: optional('VAPID_PRIVATE_KEY', 'SSFclfl4mYNO8cvtpD285HeZDEFLO1MK-XKz8cFhvrY'),
  VAPID_SUBJECT:     optional('VAPID_SUBJECT', 'mailto:noreply@aluhub.com'), // required by Web Push spec
} as const;

export const isProduction = env.NODE_ENV === 'production';
