# ALU Hub

Student platform for ALU & CMU-Africa.

## Architecture

Decoupled frontend / backend. The frontend has no knowledge of backend
internals — it talks to the backend only over HTTP through a CORS-guarded
API surface.

```
ALUHUB/
├── client/   Web frontend  — Vite + React + TypeScript
├── server/   Backend API   — Node.js + Express + TypeScript
└── mobile/   Mobile app    — Flutter (Dart)
```

- **Database:** PostgreSQL via Supabase. Keys live in `server/.env`.
- **Auth:** access + refresh token rotation (see `server/src/lib/tokens.ts`).
- **CORS:** backend allows only the origins listed in `CLIENT_ORIGINS`.

## Getting started

### 1. Backend (`server/`)

```bash
cd server
cp .env.example .env        # then fill in the secret values
npm install
npm run dev                 # http://localhost:4000
```

Run the SQL in `server/db/` against your Supabase project:
`schema.sql`, `auth_tokens.sql`, `follow_migration.sql`.

### 2. Web client (`client/`)

```bash
cd client
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

The original ALU Hub UI is preserved in `client/legacy-src/` and is
compiled ahead-of-time by `scripts/build-legacy.mjs` (no in-browser Babel
— this is the main performance win over the old setup).

### 3. Mobile app (`mobile/`)

```bash
cd mobile
flutter pub get
flutter run --dart-define=API_URL=http://10.0.2.2:4000
```

## Progressive Web App (PWA)

The web app is fully PWA-enabled with push notifications, offline support, and install prompts. Users can install it from the browser on any device (no Play Store required).

**Features:**
- ✅ Install as app (iOS 16.4+, Android, desktop)
- ✅ Push notifications (via Web Push API + FCM backend)
- ✅ Offline support (app shell caching, network fallback for API calls)
- ✅ Home screen icon
- ✅ Standalone mode (no browser chrome)

**How it works:**
1. Service worker (`public/service-worker.js`) handles offline & caching
2. On login, the app requests notification permission and registers with Web Push
3. The server sends pushes via the same FCM backend to both Android and web clients
4. Users see an iOS-style install banner on compatible browsers

**Server setup (required for push):**

The server needs VAPID keys (Web Push standard). Default test keys are included, but for production:

```bash
# Generate new keys (one-time)
node -e "const wp=require('web-push'); console.log(JSON.stringify(wp.generateVAPIDKeys()))"
```

Set in Render environment:
- `VAPID_PUBLIC_KEY` — shared with clients
- `VAPID_PRIVATE_KEY` — kept secret on server
- `VAPID_SUBJECT` — email or URL for Push Service contact (default: noreply@aluhub.com)

## Android APK distribution

The web app's left sidebar has a **Get the Android app** link that hits
`GET /api/download/android` on the server, which 302-redirects to the
latest release APK on GitHub Releases. The CI workflow
`.github/workflows/build-android-apk.yml` publishes the raw `.apk` as an
asset on the `android-latest` release tag on every push to `main`, so the
download URL is stable across builds and the file is **not** zipped (unlike
Actions artifacts, which GitHub auto-wraps in a zip).

### Reducing the Play Protect "scan this app" warning

A debug-signed APK trips Play Protect hard. To sign release builds with a
real upload keystore (and dramatically reduce the warning), generate a
keystore once and add four secrets to the GitHub repo.

```bash
# Generate the keystore (one-time, locally — keep the file safe!)
keytool -genkeypair -v \
  -keystore aluhub-release.keystore \
  -alias aluhub \
  -keyalg RSA -keysize 2048 -validity 10000

# Base64-encode for the GitHub secret
base64 -w 0 aluhub-release.keystore > keystore.b64
```

In GitHub → Settings → Secrets and variables → Actions, add:

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | contents of `keystore.b64` |
| `ANDROID_KEYSTORE_PASSWORD` | store password from `keytool` |
| `ANDROID_KEY_ALIAS` | `aluhub` (or whatever `-alias` you used) |
| `ANDROID_KEY_PASSWORD` | key password from `keytool` |

Without these the build still works — it falls back to debug signing and
prints a warning. With them, the release APK is properly signed.

> Even with proper signing, Play Protect may still warn the first few
> times an APK from a new developer key is sideloaded. The only way to
> remove the warning entirely is to distribute through the Google Play
> Store. The "Install anyway" button is intentionally subtle by Android
> design and cannot be hidden from inside the APK.

### Server env (optional)

- `ANDROID_APK_URL` — override the redirect target for `/api/download/android`.
  Defaults to the `android-latest` GitHub Release asset.
