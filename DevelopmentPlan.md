# Food Map Development Plan

## Stage 0: Foundation (Complete)

Create a React + TypeScript + Vite application with mobile-first welcome and login-placeholder pages, HashRouter, PWA shell, typed Firebase configuration boundary, tests, GitHub Pages workflow, and documentation. No Firebase project or SDK connection is included.

Acceptance criteria:

- `npm install`, `npm run dev`, `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` pass once Node.js LTS is available.
- `/food-map/#/` works at phone width and navigates to `/food-map/#/login`.
- PWA manifest, service worker, icons, `start_url`, scope, and Vite base all use `/food-map/`.
- No secrets are committed; `.env.example` documents public Firebase Web config only.
- GitHub Actions runs install, lint, typecheck, test, build, and deploys `dist`.

## Stage 1: Google Sign-In and Data Security

Firebase modular SDK adapters, Google Sign-In, `AuthProvider`, `useAuth`, `AuthRepository`, `UserProfileRepository`, protected routes, logout/private-state cleanup, restrictive Firestore/Storage Rules, and an isolated Emulator test suite are implemented. The private root route now shows a Stage 1 placeholder only.

Remaining local acceptance step: install Java 11+ and run `npm run test:rules`. It must prove anonymous and cross-user access denial, owner profile access, profile validation, Storage path isolation, and default denial. No restaurant or other Stage 2 data model is included.

## Stage 2: Models and Restaurant CRUD

Add typed documents/repositories, validation, restaurant list, manual add/edit/delete, favorite/status, soft delete, and user-scoped queries.

Acceptance criteria: failed or ambiguous geocoding cannot silently save a location; recommended dishes are independent records; rating/money validation tests pass.

## Stage 3: Map and Location

Install only the selected map library after provider/cost tests. Implement browser location states, markers, summary card, map navigation, geocoding candidates, and a location-denied alternative flow.

Acceptance criteria: saved restaurants remain usable without location permission; location errors/timeouts are recoverable; touch/marker behavior passes iPhone Safari and Android Chrome checks.

## Stage 4: Restaurant Detail and Recommendations

Add restaurant details, labels, source URL, independent recommendation records, favorite, and status updates.

## Stage 5: Visits and Personal Reviews

Add multiple visit records, dish reviews, $1$-$5$ rating validation, integer-minor-unit currency, revisit intent, and photo metadata references.

## Stage 6: Photo Upload

Evaluate `browser-image-compression` before installation; add it only if native browser compression fails mobile memory/quality testing. Implement format/size checks, thumbnails, private Storage upload state/retry, and deletion cleanup.

## Stage 7: Photo OCR and Import Drafts

Select browser OCR or a backend only after privacy/performance tests. Implement raw text, extractor interface, editable review, address confirmation, and explicit restaurant creation.

## Stage 8: Instagram/YouTube Link Drafts

Implement URL/platform validation and legal metadata only. Preserve original URL and require manual completion. Do not scrape or portray metadata as complete media content.

## Stage 9: Offline, PWA, and Release

Enable Firestore persistent cache, add sync state and PWA update UI, evaluate Dexie only for verified upload-queue gaps, finish offline behavior, deploy, and run real-device acceptance tests.

## Deferred Package Decisions

- `firebase`: required in Stage 1; deferred because Stage 0 must not connect Firebase.
- `zod`: evaluate when Stage 2 needs shared form schemas.
- `react-hook-form`: evaluate when manual restaurant/visit forms are implemented.
- `@tanstack/react-query`: evaluate only if Firestore listener/cache complexity exceeds feature hooks.
- `browser-image-compression`: evaluate in Stage 6 after mobile image testing.
- `dexie`: evaluate in Stage 9 only if Firestore cache cannot satisfy draft/upload queues.

## Current Risks

- Firebase Emulator Rules tests require Java 11+ on each development/CI machine.
- Google sign-in requires the documented Firebase Console setup and GitHub Pages hostname authorization.
- SVG PWA icons are suitable for the foundation but should be replaced by generated PNG icons before production iPhone installation validation.