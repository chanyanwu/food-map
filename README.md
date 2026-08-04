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

To display restaurant locations, set `VITE_GOOGLE_MAPS_API_KEY` in `.env.local` to a browser-restricted API key with the Maps JavaScript API enabled. The app shows `尚未設定 Google Maps API Key` instead of loading a map when it is absent. Do not use a server key or commit a real key.

Nearby restaurants use the browser location only after selecting `使用目前位置`. The location is not written to Firestore. Nearby results are calculated from saved restaurant coordinates and show straight-line distance, not driving distance or travel time. Without `VITE_GOOGLE_MAPS_API_KEY`, nearby filtering, sorting, and the restaurant list still work; only the embedded map is unavailable. `在 Google Maps 開啟` uses a standard Maps search URL and needs no API key, opens the place in a new tab, and never adds it to a Google Maps saved list. This feature does not use Google Places, reviews, Directions, or Geocoding APIs.

## Stage 4A: Social Content Import

Authenticated users can open `#/restaurants/import` to save a social source link, manually pasted text, personal notes, and up to five local screenshots. Source links are stored only as links: Food Map does not fetch social pages, download or parse short videos, expand short URLs, or use Google Places or Google reviews.

OCR runs only after the user chooses `開始辨識文字`. It uses Tesseract.js in the browser with Traditional Chinese and English language data. The initial worker and language-data download can take time; screenshots are never sent to a third-party OCR service. Tesseract output is editable and may be wrong, so users must review a selected restaurant candidate before saving.

Screenshots are validated locally as JPEG, PNG, or WebP, with a 10 MB limit per image. They are previewed with temporary browser object URLs and are not uploaded to Firebase Storage or kept after a refresh. Check that screenshots and source text do not contain personal information you do not want to save.

`Restaurant` remains the clean restaurant record. Each submitted import also creates a separate `RestaurantSource` record containing the source platform, nullable URL, combined source text, personal note, and up to 10 mentioned dishes of at most 100 characters each. A restaurant can therefore have multiple future sources. Restaurant creation happens before source creation; if the source write fails, the UI reports that partial result and provides a retry for the source rather than pretending the import fully succeeded.

Stage 4B may consider user-authorized short-video captions, speech-to-text, and AI-assisted structured extraction. None are part of Stage 4A.

## Routes

- `#/` Private Stage 1 home; authentication required
- `#/login` Google sign-in
- `#/offline` Offline placeholder
- `#/restaurants/import` Protected social-content import workflow
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