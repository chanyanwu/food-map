# Food Map

Food Map is a mobile-first private food-map PWA. Stage 1 implements Google Authentication, protected routes, the user profile security boundary, Firebase Emulator configuration, and Firestore/Storage Security Rules. Restaurant, map, upload, OCR, and social-link features remain deferred.

## Prerequisites

- Node.js 22 LTS (or current Node LTS)
- npm
- Git
- Java 11 or newer for the Firebase Firestore Emulator

## Local development

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
npm run emulators
npm run test:rules
```

Copy `.env.example` to `.env.local` before connecting Firebase locally. Do not commit it. Firebase Web configuration is public client configuration, not a security mechanism; Authentication plus Firestore and Storage Rules enforce access. Never place service-account JSON, Firebase Admin keys, Google OAuth client secrets, AI API secrets, or server management keys in this project.

Set `VITE_USE_FIREBASE_EMULATOR=true` only for local development after starting `npm run emulators`. Production builds ignore this flag, so they never automatically connect to localhost.

## Routes

- `#/` Private Stage 1 home; authentication required
- `#/login` Google sign-in
- `#/offline` Offline placeholder
- `#/*` Not Found

The production Vite base is `/food-map/`; local Vite development still serves the app normally.

## Stage 0 Manual Verification

- [ ] Chrome Desktop
- [ ] Edge Desktop
- [ ] 375px mobile viewport
- [ ] Dark Mode
- [ ] Keyboard Tab focus
- [ ] `prefers-reduced-motion`
- [ ] Navigate from the welcome screen to the login page
- [ ] Open `#/login` directly
- [ ] Confirm an unknown route renders Not Found
- [ ] Confirm the browser console has no red errors
- [ ] Confirm the browser recognizes the PWA manifest

## Deployment

The workflow in `.github/workflows/deploy-pages.yml` deploys `dist` to GitHub Pages after the `main` branch passes install, lint, typecheck, test, and build. It stays compatible with `https://chanyanwu.github.io/food-map/`, Vite base `/food-map/`, and HashRouter.

### Firebase Console Checklist

1. Create a Firebase project and Firebase Web App.
2. Enable Authentication and the Google provider.
3. Add `chanyanwu.github.io` to Authentication Authorized Domains. Enter only the hostname, not `https://chanyanwu.github.io/food-map/`.
4. Create Firestore Database and Firebase Storage.
5. Review and deploy [firestore.rules](firestore.rules) and [storage.rules](storage.rules) using an explicitly configured local Firebase CLI project.
6. Add `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_APP_ID`, and optional `VITE_FIREBASE_MESSAGING_SENDER_ID` as GitHub repository secrets or variables.
7. Verify Google sign-in at `https://chanyanwu.github.io/food-map/`.

Do not commit a real `.firebaserc`; use [.firebaserc.example](.firebaserc.example) for the safe local Emulator alias. `npm run test:rules` uses the isolated `demo-food-map` project and never deploys Rules.

## Documentation

- [Architecture.md](Architecture.md)
- [DevelopmentPlan.md](DevelopmentPlan.md)