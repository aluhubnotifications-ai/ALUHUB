# ALU Hub — Mobile (Flutter)

Native mobile client for ALU Hub. Talks to the same backend API as the
web client; it has no knowledge of backend internals.

## Run

```bash
flutter pub get
flutter run --dart-define=API_URL=http://10.0.2.2:4000
```

`10.0.2.2` is how the Android emulator reaches `localhost` on the host
machine. For a physical device, pass your machine's LAN IP, and add that
origin to `CLIENT_ORIGINS` in `server/.env`.

## Token rotation

Native apps can't use httpOnly cookies, so the backend also returns the
refresh token in the JSON body. `TokenStorage` keeps both tokens in the
platform secure store (Keychain / Keystore). `AuthService` rotates them
automatically on a 401 — see `lib/services/`.
