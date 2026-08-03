# Food Map Web Architecture

## Product and Stage Boundary

Food Map is a mobile-first private food-map PWA built with React, TypeScript, Vite, Firebase, and GitHub Pages. Stage 1 implements Google Authentication, a private home placeholder, user profiles, Firebase Emulator configuration, and restrictive Firestore/Storage Rules. It does not implement restaurant data, maps, location, uploads, OCR, or social-link parsing.

## Application Structure

Use feature-first React with small repository/service interfaces. Pages and components receive data through feature hooks; UI does not call Firebase SDK APIs directly. Dependencies are composed by providers in Stage 1, not global mutable singletons.

```
Page / component -> feature hook -> repository or service interface -> Firebase or browser adapter
```

```
src/
  app/                 App, router, providers, configuration
  core/                Firebase adapters, errors, validation, utilities
  design-system/       tokens, reusable components, global styles
  features/            feature-local pages, components, services, tests
  shared/              cross-feature components, hooks, types, constants
  test/                test setup and factories
```

Planned interfaces are `AuthRepository`, `RestaurantRepository`, `VisitRecordRepository`, `PhotoRepository`, `ImportDraftRepository`, `GeocodingService`, `LocationService`, `TextRecognitionService`, `RestaurantInformationExtractor`, and `SocialLinkMetadataService`.

## Routing, PWA, and Deployment

Vite uses `base: '/food-map/'`. `HashRouter` keeps client route state after `#`, avoiding GitHub Pages direct-link 404s. `/` is protected, `/login` is public and redirects authenticated users to their requested path, `/offline` and Not Found stay public. `ProtectedRoute` records the requested hash route before redirecting unauthenticated users.

`vite-plugin-pwa` supplies the app-shell precache, manifest, and service-worker registration. The manifest uses `start_url: '/food-map/#/'` and `scope: '/food-map/'`. The Stage 0 offline page is a route placeholder, not a promise that every un-cached navigation works offline.

GitHub Actions deploys `dist` after `npm ci`, lint, typecheck, test, and build on `main`. GitHub Pages must use Actions as its deployment source.

## Firebase Boundary

`src/app/config/firebase.ts` maps only Vite environment values into a typed public Firebase Web config. `core/firebase/firebaseClient.ts` is the only Firebase initialization adapter. `AuthProvider` composes `FirebaseAuthRepository` and `FirebaseUserProfileRepository`; UI uses `useAuth` and never calls Firebase SDK APIs. Missing configuration renders a clear error screen. `VITE_USE_FIREBASE_EMULATOR=true` connects local development only; production builds cannot connect to localhost.

Never put Firebase Admin keys, service-account JSON, AI secrets, server API secrets, or Google Maps server keys in React or `VITE_` variables.

## Firestore and Storage Design

Choose private-user root collections (scheme A):

```
users/{uid}
users/{uid}/restaurants/{restaurantId}
users/{uid}/restaurants/{restaurantId}/recommendedDishes/{dishId}
users/{uid}/restaurants/{restaurantId}/visitRecords/{visitId}
users/{uid}/restaurants/{restaurantId}/visitRecords/{visitId}/dishReviews/{dishReviewId}
users/{uid}/importDrafts/{draftId}
```

This keeps user-scoped querying, Security Rules, index scope, and query cost straightforward. Future sharing must use an explicit membership/shared aggregate rather than weakening these private paths. Firestore parent deletion does not delete subcollections; permanent deletion requires an explicit server/admin cleanup process.

Storage uses private paths such as `users/{uid}/restaurants/{restaurantId}/{photoId}.webp`. Firestore stores only path, thumbnail path, MIME type, dimensions, caption, and upload status (`pending | uploading | uploaded | failed`), never Base64 data. Delete flows remove Storage and metadata with retry/orphan cleanup for partial failures.

## Data Contract

- Documents use client UUIDs, Firebase `Timestamp`, `schemaVersion`, and fixed string enums.
- Rating is an integer from $1$ to $5$.
- Amounts use integer minor units plus ISO currency code, never floating-point currency.
- Restaurant status: `wantToVisit | visited`.
- Source: `manual | photo | instagram | youtube`.
- Import: `draft | readyForReview | saved | discarded | failed`.
- Soft delete records `deletedAt` and default queries exclude it. A later retention cleanup permanently deletes child documents and Storage files.
- Missing `schemaVersion` is treated as version 1. Additive changes are read-time compatible; breaking changes require idempotent backend/admin migration and orphan cleanup.

`UserProfile`, `Restaurant`, `RecommendedDish`, `VisitRecord`, `DishReview`, `RestaurantPhoto`, and `ImportDraft` follow the user-supplied fields, with owner identity included in queryable records and enforced by Rules.

## Security Plan

Stage 1 Firestore Rules allow only `users/{uid}` for its authenticated owner. They require matching path and `id`, a fixed schemaVersion 1, allowed profile fields, server timestamp creation/update fields, and immutable `id`/`createdAt`. All other Firestore paths are denied. Storage Rules only allow `users/{uid}/...` for that same authenticated uid; all other paths are denied. MIME and size constraints wait for Stage 6 because Stage 1 has no upload feature.

Firebase Emulator Suite tests will prove anonymous denial, cross-user denial, ownerId tampering denial, valid owner access, and Storage MIME/size restrictions. Front-end query constraints are never treated as authorization.

## Dependency Risk Register

| Advisory | Package | npm severity | Affected capability | Used here? | Temporary decision | Re-evaluate when |
| --- | --- | --- | --- | --- | --- | --- |
| GHSA-qwww-vcr4-c8h2 | `react-router@7.18.2` | high | React Server Components action handling | No. Food Map is a Vite SPA using HashRouter; it has no RSC, framework mode, server actions, or unstable RSC APIs. | Accept temporarily; do not run `npm audit fix --force` or arbitrarily downgrade/major-upgrade only to reduce audit count. | A compatible fixed React Router release is available, or the app adopts SSR/RSC/framework APIs. |

## Map Decision for Stage 3

Recommend **MapLibre GL JS** with a separately selected vector-tile and geocoding provider. It supports iPhone Safari, Android Chrome, PWA, browser location, custom markers, and hand-drawn visual styling without coupling map rendering to Google authentication.

| Option | Strength | Constraint |
| --- | --- | --- |
| Google Maps JavaScript API | Mature mobile support and strong address/places coverage | Billing, quota, client-key restrictions, and less styling freedom. Google Sign-In does not include Maps entitlement. |
| MapLibre GL JS | Mobile/PWA support and strong custom style control | Needs tile/geocoding provider; Chinese address quality, costs, and key handling depend on that provider. |
| Leaflet | Small, stable, easy markers | Raster tiles offer less visual styling; still requires tile/geocoder providers and device validation. |

No map package is installed in Stage 0. The decision is validated using Taiwan/target-locale Chinese searches, iPhone Safari, Android Chrome, location permission denial/timeout, touch gestures, marker accessibility, provider cost, and quota behavior.

## Import Boundaries

Photo OCR and restaurant extraction are separate services. Every extracted value becomes an editable `ImportDraft`; no OCR result silently creates a restaurant. Future remote OCR/AI requires a backend, and its secret cannot enter the browser.

Instagram/YouTube import validates URL/platform and stores original URL. It may display legal, reliable metadata only. It must not scrape, bypass login, or claim access to captions, speech, full posts, subtitles, locations, or restaurant addresses. Richer parsing requires official APIs, consent, policy review, and backend credentials.

## Offline and Synchronization

Firestore persistent local cache becomes the structured-data cache in Stage 9. Service Worker supplies the app shell. Dexie/IndexedDB is deferred until testing demonstrates a need for local photo drafts or an upload queue beyond Firebase capabilities.

Offline users may open the app, read cached restaurant text, and create local restaurant/visit drafts. New login, tiles, geocoding, uploads, remote OCR/AI, and social metadata may fail offline. Pending/synced/failed states and retry are required. Multi-device edits and photo uploads have no automatic conflict-free guarantee.

## Design and Quality

CSS tokens centralize warm paper/surface/ink/brand colors, spacing, radii, shadows, icon sizes, and breakpoints. Native controls retain keyboard focus, 48 px touch targets, ARIA labels, dark mode, Chinese system font fallbacks, and reduced-motion behavior. Hand-drawn character is limited to restrained irregular borders, paper lines, and Lucide line icons.

Vitest/RTL cover validation, mapping, errors, and page states. Playwright covers HashRouter and later full user workflows. Firebase Rules tests run only on Emulator Suite. Manual checks cover Chrome, Edge, Android Chrome, iPhone Safari, add-to-home-screen, OAuth redirect, photo picker, location, map touch, PWA update, and logout privacy.