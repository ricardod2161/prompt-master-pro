
## Analysis Summary

All issues identified are real and confirmed by code inspection. Here's what needs to be done:

**1. AuthContext — duplicate subscription state & polling issues**
- `checkSubscription` is currently called 3+ times on login (via `onAuthStateChange`, `getSession`, and the `useEffect` watching `user`)
- The `visibilitychange` listener fires `checkSubscription` on every tab focus — this is excessive
- Polling interval is 300,000ms (5 min) — needs to be 600,000ms (10 min)
- Fix: only call `checkSubscription` once (via the `useEffect` watching `user`); in `onAuthStateChange`, only call it on `SIGNED_IN` event (not on every state change)

**2. useSubscription hook — duplicate source of truth**
- `src/hooks/useSubscription.ts` has its own `checkSubscription` and `SubscriptionState` that overlap with `AuthContext`
- `Pricing.tsx` and `SubscriptionSuccess.tsx` import both, creating ambiguity
- Fix: strip `checkSubscription` and state management from the hook; make it action-only (`startCheckout`, `openCustomerPortal`)

**3. Reports.tsx — no date filter passed to query**
- `useOrders()` is called without any filter, fetching ALL orders from the database; client-side filtering is done after
- Fix: pass `{ date: selectedDate }` to the query, or for week/month ranges add a custom `dateRange` filter to `useOrders`

**4. useDashboard.ts — manual state instead of React Query**
- Uses `useState` + `useCallback` + `useEffect` manually
- Has 3 separate Supabase Realtime channels for the same data
- Fix: rewrite with `useQuery`; consolidate the 3 realtime channels into 1

**5. UnitContext.tsx — manual state instead of React Query**
- Uses `useState` + `useCallback` + `useEffect` manually; units are refetched on every remount
- Fix: use `useQuery` with `queryKey: ['units', user?.id]`

**6. useOrders.ts — no query limit**
- Fetches all orders with full joins (order_items, order_payments, tables, delivery_orders)
- Fix: add `.limit(200)` default; KDS page passes `status` filter directly

**7. ErrorBoundary**
- No app-level error boundary; one broken component can crash the whole app
- Fix: create `src/components/shared/ErrorBoundary.tsx` and wrap `AppLayout` + public routes in `App.tsx`

**8. KDS sound — already partially implemented but using a broken base64 audio**
- The current audio is a tiny invalid base64 WAV that won't play reliably cross-browser
- Fix: replace with Web Audio API oscillator beep; add on/off toggle with localStorage persistence

**9. Package cleanup — Capacitor + unused libs**
- Capacitor packages (`@capacitor/core`, `@capacitor/android`, `@capacitor/ios`, `@capacitor/cli`) are not used in any `.tsx`/`.ts` files (only `capacitor.config.ts`)
- `embla-carousel-react` is only used in the `ui/carousel.tsx` component which is never imported outside `src/components/ui/`
- `react-resizable-panels` is only used in `ui/resizable.tsx` which is never imported outside `ui/`
- `input-otp` is only used in `ui/input-otp.tsx` which is never imported outside `ui/`
- `vaul` IS used: `SplitBillSheet`, `TableBillSheet`, `CustomerOrder`, `Tables` all use Sheet components which ultimately use `drawer.tsx` from `vaul` — **cannot remove vaul safely**
- Safe removals: `@capacitor/*`, `embla-carousel-react`, `react-resizable-panels`, `input-otp`

---

## Implementation Plan

### Files to modify:

**`src/contexts/AuthContext.tsx`**
- In `onAuthStateChange`: only call `checkSubscription()` on `SIGNED_IN` event (not every state change)
- Remove `checkSubscription()` call from `getSession()` (it's triggered by `useEffect` watching `user` anyway)
- Increase polling interval from 5 min → 10 min
- Remove `visibilitychange` listener (excessive polling)
- Confirm `clearInterval` is always called in cleanup

**`src/hooks/useSubscription.ts`**
- Remove `checkSubscription`, `SubscriptionState`, and all local state
- Keep only `isLoading`, `createCheckout`, `openCustomerPortal`, `startCheckout`
- Internally use `useAuth()` where needed (e.g. toast only)

**`src/hooks/useOrders.ts`**
- Add `.limit(200)` to the default query
- Add optional `dateRange?: { start: Date; end: Date }` to the filters interface to support Reports properly

**`src/pages/Reports.tsx`**
- Compute the date range first, then pass `dateRange` filter to `useOrders({ dateRange })`
- Remove the client-side `filteredOrders` memo (server now filters)

**`src/hooks/useDashboard.ts`**
- Rewrite using `useQuery` from React Query with `queryKey: ['dashboard', selectedUnit?.id]` and `staleTime: 30_000`
- Consolidate 3 Supabase Realtime channels into 1 `dashboard-realtime-{unitId}` channel that subscribes to both `orders` and `cash_registers` tables
- Channel calls `queryClient.invalidateQueries` instead of manual `fetchDashboardData()`

**`src/contexts/UnitContext.tsx`**
- Replace `useState + useCallback + useEffect` with `useQuery` from React Query
- Keep `selectedUnit` in `useState` as before (it's UI-local state)

**`src/pages/KDS.tsx`**
- Remove the `<audio>` element and `audioRef`
- Replace with Web Audio API oscillator beep in the sound notification `useEffect`
- Add a `soundEnabled` toggle button in the header (Bell icon), persisted to `localStorage`

**`src/components/shared/ErrorBoundary.tsx`** _(new file)_
- React class component with `componentDidCatch`
- Friendly error screen with "Recarregar" button

**`src/App.tsx`**
- Wrap `<AppLayout />` route and top-level routes with `<ErrorBoundary>`

**`package.json`**
- Remove: `@capacitor/android`, `@capacitor/cli`, `@capacitor/core`, `@capacitor/ios`, `embla-carousel-react`, `react-resizable-panels`, `input-otp`
- Note: `vaul` is kept because `drawer.tsx` is actively used via Sheet components in `CustomerOrder`, `Tables`, `SplitBillSheet`, `TableBillSheet`

**UI component stubs** (to avoid broken imports after package removal):
- `src/components/ui/carousel.tsx` — replace with a no-op stub (it's not used in app pages)
- `src/components/ui/resizable.tsx` — replace with a no-op stub
- `src/components/ui/input-otp.tsx` — replace with a no-op stub
