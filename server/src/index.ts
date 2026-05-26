import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { authRouter } from './routes/auth.js';
import { healthRouter } from './routes/health.js';
import { aiRouter } from './routes/ai.js';
import { emailRouter } from './routes/email.js';
import { pushRouter } from './routes/push.js';
import { downloadRouter } from './routes/download.js';
import { probeFcmConfig } from './lib/fcm.js';
import { notFound, errorHandler } from './middleware/error.js';

const app = express();

// ── CORS ───────────────────────────────────────────────────────────
// The frontend is fully decoupled — it only reaches the backend through
// this guarded surface. Only the configured origins may call the API,
// and credentials are allowed so the refresh-token cookie can flow.
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.CLIENT_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin not allowed by CORS: ${origin}`));
      }
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.use('/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/ai', aiRouter);
app.use('/api/email', emailRouter);
app.use('/api/push', pushRouter);
app.use('/api/download', downloadRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`aluhub-server listening on http://localhost:${env.PORT}`);
  console.log(`CORS origins: ${env.CLIENT_ORIGINS.join(', ')}`);
  console.log(
    `[Email] config — BREVO_API_KEY=${env.BREVO_API_KEY ? `set (len ${env.BREVO_API_KEY.length})` : 'MISSING'}, ` +
    `FROM="${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM_ADDR}>`,
  );
  if (!env.BREVO_API_KEY) {
    console.warn('[Email] BREVO_API_KEY is not set — emails will be skipped. Add it in Render → Environment to enable.');
  }

  // FCM probe: verify the service account loads and Google accepts our JWT
  // at boot, so misconfigurations surface in startup logs instead of on
  // the first user's push attempt.
  probeFcmConfig()
    .then((p) => {
      console.log(
        `[FCM] config — projectId=${p.projectIdSet ? 'set' : 'MISSING'}, ` +
        `serviceAccountPath=${p.serviceAccountPathSet ? 'set' : 'MISSING'}, ` +
        `loadable=${p.serviceAccountLoadable}, mintable=${p.tokenMintable}`,
      );
      if (!p.serviceAccountLoadable && p.serviceAccountReason) {
        console.warn(`[FCM] service account: ${p.serviceAccountReason}`);
      }
      if (p.serviceAccountLoadable && !p.tokenMintable && p.tokenReason) {
        console.warn(`[FCM] token mint: ${p.tokenReason}`);
      }
    })
    .catch((e) => {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[FCM] probe threw: ${msg}`);
    });
});
