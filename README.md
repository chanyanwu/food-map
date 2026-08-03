# Food Map

Food Map is a mobile-first private food-map PWA. Stage 0 supplies the React/Vite shell only; authentication, Firebase data, map, restaurant CRUD, uploads, OCR, and social-link imports are deliberately deferred.

## Prerequisites

- Node.js 22 LTS (or current Node LTS)
- npm
- Git

## Local development

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

Copy `.env.example` to `.env.local` only when Stage 1 Firebase configuration begins. Do not commit it. The listed Firebase Web configuration is public client configuration, not a substitute for Firebase Authentication, Firestore Rules, or Storage Rules.

## Routes

- `#/` Welcome screen
- `#/login` Google sign-in UI placeholder, no OAuth implementation
- `#/offline` Offline placeholder

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

The workflow in `.github/workflows/deploy-pages.yml` deploys `dist` to GitHub Pages after the `main` branch passes install, lint, typecheck, test, and build. Enable Pages with GitHub Actions as the source, then create the documented `VITE_FIREBASE_*` repository secrets before Stage 1. Add the GitHub Pages hostname to Firebase Authorized Domains once Firebase Auth is configured.

## Documentation

- [Architecture.md](Architecture.md)
- [DevelopmentPlan.md](DevelopmentPlan.md)