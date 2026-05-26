import { Router } from 'express';

export const downloadRouter = Router();

// Where the Android APK lives. Defaults to the stable GitHub Release tag
// `android-latest` that the build-android-apk workflow publishes on every
// push to main. Override via env to pin a specific build or self-host.
const DEFAULT_ANDROID_APK_URL =
  'https://github.com/aluhubnotifications-ai/aluhub/releases/download/android-latest/aluhub.apk';

const ANDROID_APK_URL =
  (process.env.ANDROID_APK_URL && process.env.ANDROID_APK_URL.trim()) ||
  DEFAULT_ANDROID_APK_URL;

downloadRouter.get('/android', (_req, res) => {
  res.redirect(302, ANDROID_APK_URL);
});
