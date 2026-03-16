
## Current State Assessment

After reading every relevant file, here is the actual status vs what the user described:

**Already DONE (from the previous refactoring session):**
- AuthContext — single `checkSubscription` call, 10-min polling, correct `clearInterval` cleanup ✅
- `useSubscription` — actions-only, no duplicate state ✅
- `useDashboard` — React Query + single consolidated Realtime channel ✅
- `UnitContext` — React Query with `staleTime: 5min` ✅
- `useOrders` — `.limit(200)` default + `dateRange` filter ✅
- `Reports.tsx` — server-side date filtering ✅
- `KDS.tsx` — Web Audio API beep + sound toggle + `localStorage` ✅
- `ErrorBoundary` — class component created ✅
- `App.tsx` — all routes wrapped in `ErrorBoundary` ✅
- Capacitor, `embla-carousel-react`, `react-resizable-panels`, `input-otp` — removed from `package.json` ✅
- UI stubs for carousel, resizable, input-otp ✅

**What the user is NOW asking:** A broader product/technical roadmap. Reading the request carefully, they want to implement the items listed in sections 3–5 of their message. The items NOT yet done are:

**Section 3 — Critical fixes still needed:**
1. `package.json` name is still `"vite_react_shadcn_ts"` — needs to be `"gastrohub"`
2. No `.env.example` file exists
3. `docs/TECHNICAL.md` exists (412 lines) but `docs/QUICKSTART.md` exists too — both exist, README placeholders remain

**Section 4 — Medium priority improvements:**
1. `React.lazy` + `Suspense` for route code splitting — ALL pages are eagerly imported in `App.tsx` (confirmed)
2. No `.env.example` file
3. `vite.config.ts` PWA: missing `navigateFallbackDenylist: [/^\/~oauth/]` (security requirement for OAuth)
4. `useIsDeveloper` makes a separate DB query — duplicates what `checkSubscription` already does (minor redundancy)

**Section 5 — Roadmap features (new functionality):**
The user wants a plan to implement these. Given scope, I'll plan the immediate actionable items:
- React.lazy code splitting (performance win, low risk)
- `.env.example` + package.json rename (branding/docs)
- PWA OAuth fix
- Lazy loading with Suspense fallback

---

## Plan

### What will be implemented:

**1. `package.json` — rename project**
- Change `"name"` from `"vite_react_shadcn_ts"` to `"gastrohub"`

**2. `.env.example` — create documentation file**
- Create `/.env.example` with all required variables documented (Supabase URL, anon key, Stripe, Evolution API URL, ElevenLabs)

**3. `App.tsx` — React.lazy + Suspense for all page routes**
- Convert all 20+ page imports to `React.lazy(() => import(...))`
- Wrap the `<Routes>` block in a `<Suspense>` with a centered spinner fallback
- This reduces initial JS bundle size significantly — only the current page's code loads on first visit

**4. `vite.config.ts` — add PWA OAuth denylist**
- Add `navigateFallbackDenylist: [/^\/~oauth/]` to the workbox config to prevent the service worker from caching OAuth redirect routes

**5. `README.md` — fix placeholders**
- Replace `<YOUR_GIT_URL>` and `<YOUR_PROJECT_NAME>` with actual values
- Update install section to reflect the correct project name

### Files to change:
- `package.json` — rename `name` field
- `.env.example` — new file
- `src/App.tsx` — lazy imports + Suspense
- `vite.config.ts` — PWA denylist
- `README.md` — fix placeholders

### What is NOT in scope (requires separate discussion):
- WhatsApp bot implementation (Edge Function + AI) — large feature, needs separate prompt
- Mercado Pago / Pix payment integration — requires payment gateway credentials
- iFood/Rappi API integration — requires official partner access
- White-label theming — large feature
- Storybook — separate tooling setup
- GitHub Actions CI/CD — needs repository access

These are roadmap items the user can request one by one as dedicated features.
