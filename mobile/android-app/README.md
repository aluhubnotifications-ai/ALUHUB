# ALU Hub — Android app

Tiny WebView wrapper around the deployed web client. Whatever the web app
looks like in a browser, the Android app looks identical — same styles,
same background, same responsiveness — because it IS the web app loaded
in a system WebView.

- `minSdk` 26 (Android 8.0+), `targetSdk` 35 (Android 15)
- Edge-to-edge layout, transparent system bars, status bar tinted navy
  to match the web topbar
- Hardware back button = WebView history navigation
- External links (different host, `mailto:`, `tel:`) open in the OS
  default handler instead of inside the WebView

## Building

You don't need a local Android SDK — every push to `main` that touches
`mobile/android-app/**` triggers `.github/workflows/build-android-apk.yml`
which builds a debug AND release APK and uploads them as artifacts.
Download from GitHub → Actions → the latest run → "Artifacts" panel.

### Locally (optional)

```bash
cd mobile/android-app
# generate the wrapper once if it isn't already there
gradle wrapper --gradle-version 8.7
# debug build → app/build/outputs/apk/debug/app-debug.apk
./gradlew assembleDebug
# release build (signed with the debug keystore) → app/build/outputs/apk/release/
./gradlew assembleRelease
```

## Pointing at a different web URL

Default is `https://aluhub.pages.dev`. Override at build time:

```bash
./gradlew assembleRelease -PwebAppUrl=https://your-domain.example
```

Or in CI, trigger the workflow manually (`workflow_dispatch`) and pass
`web_app_url`.

## Push notifications (Firebase Cloud Messaging)

The app is wired for FCM but pushes only activate once you commit the
Firebase config file:

1. In Firebase Console → Project settings → "Your apps", register an
   Android app with package name `com.aluhub`.
2. Download `google-services.json`.
3. Drop it at `mobile/android-app/app/google-services.json` and commit.

Without that file the build succeeds, but `FirebaseMessaging.getInstance()`
throws at runtime and no pushes are delivered. With it, the app:

- registers an FCM token on launch and exposes it to the web app via
  `window.AluHubNative.getFcmToken()`;
- prompts the user for the Android 13+ `POST_NOTIFICATIONS` permission
  on first launch;
- shows a system notification (channel `aluhub_default`) for every push
  the backend sends, deep-linking to the route in the push payload.

Server-side setup: see `server/db/push_tokens.sql` and the
`FCM_PROJECT_ID` / `FCM_SERVICE_ACCOUNT_PATH` env vars in `render.yaml`.
