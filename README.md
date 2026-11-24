# civicXindo – National Welfare Schemes Portal (demo)

A Progressive Web App that covers a welfare scheme from start to finish: ministries publish schemes, citizens check eligibility, apply, store documents and track applications, and officials verify, sanction and pay. Every step is logged, budgets are shown as they are spent, and likely fraud is flagged before money is released.

> **Demo prototype – not an official government website.** All scheme names, departments, people and data are fictional. The app does not use the State Emblem, the national flag or any real ministry or portal logo. The civicXindo mark (a double ring with 24 thin spokes of alternating length and an open hub) is original artwork.

## Quick start

```bash
npm install
npm run dev          # development server at http://localhost:5173 (no service worker)
npm run build        # type-check, production build, service worker, prerendered landing page
npm run preview      # serves dist/ at http://localhost:4173 (use this to test install and offline)
```

Requires Node 18 or later.

## Demo logins

**Citizens** (`/login`): tap a demo profile, then enter **any 6-digit OTP**. Any other valid mobile number creates a new profile, which you complete while applying.

| Name | Mobile | Profile |
|---|---|---|
| Priya Sharma | 9876500001 | Student, 19, Maharashtra, income ₹1.8 lakh |
| Ramesh Yadav | 9876500002 | Farmer, 45, Uttar Pradesh |
| Kamala Devi | 9876500003 | 68, Bihar, SC, income ₹60,000 |

**Officials** (`/gov/login`): choose a demo account.

| Role | Name | Lands on |
|---|---|---|
| District Officer | Sunita Kulkarni | Verification queue |
| Scheme Author | Arjun Mehta | Scheme builder |
| Scheme Approver | Dr. Farah Siddiqui | Approvals (side-by-side changes) |
| Sanctioning Authority | Vikram Rao | Sanction and pay |
| Portal Manager | Neha Iyer | Command view |

## A 5-minute walkthrough of the connected state

1. Sign in as **Priya** and apply for **Udaan Kanya Shiksha Protsahan**. Wallet documents attach in one tap. Upload a residence certificate to see the scan line and "Detected: …" chip. Submit to get a reference number and download the PDF acknowledgement (with QR code).
2. Wait about 20 seconds. The simulated back office **auto-verifies** the application and a notification appears.
3. In `/gov/login`, choose **District Officer** and open the file. **Recommend** it; the next file opens automatically. Clean files can also be bulk-recommended, and on mobile you can swipe a row.
4. Choose **Sanctioning Authority**, select the application, **Create payment batch**, then **Release payment**. Each beneficiary ticks to "Credited".
5. Back as Priya, open **Track**. The timeline draws to "Amount credited" and the **APPROVED / स्वीकृत** stamp settles once.
6. Open **Verify a document** and enter the reference number (or scan the QR code on the acknowledgement): "Genuine ✓".
7. As **Portal Manager**, see budget use, the three seeded **fraud cases** (shared bank account, duplicate ID, tampered document), publish the approved "Matsya Sampada" scheme using its checklist, pause a scheme, answer grievances and filter the **audit log**, which records every step above.

Other flows: **Scheme Author** → New scheme (Basics → visual rule builder → form fields → documents → budget → dates → Preview as citizen) → Submit; **Scheme Approver** reviews the "Kaushal Path" revision in a side-by-side "what changed" view. A district officer can **Send back** a file (a comment is required); the citizen then sees "Correction needed" with a **Fix and resubmit** button (Ramesh has one already).

**Reset demo data** (Profile and settings) restores everything. All data lives in IndexedDB on the device.

## Testing install and offline mode

1. `npm run build && npm run preview`, then open http://localhost:4173 in Chrome.
2. **Install**: on the second visit, or after finishing the eligibility check, a bottom sheet offers "Add civicXindo to your home screen". On iOS Safari it shows the Share → "Add to Home Screen" guide. You can also use Profile and settings → Install app. The manifest has `standalone` display, theme colours, 192, 512 and maskable icons, and shortcuts for Check eligibility, Track application and My documents.
3. **Offline**: DevTools → Network → Offline (or Application → Service workers → Offline).
   - A banner slides down: "You are offline. Your work is saved on this device."
   - Application drafts autosave to IndexedDB on every change.
   - Submitting an application or grievance queues it as "Waiting to send" (Background Sync where supported, plus a retry on the `online` event as a fallback).
   - Go back online: queued items send automatically, the banner turns green with "Back online · N items sent", then slides away.
   - The document wallet and all schemes work fully offline. Pages not cached yet show the branded `offline.html`.
4. **Updates**: rebuild while the preview tab is open, then reload. A toast says "A new version is available" with a **Refresh** button.
5. **Notifications**: Profile and settings → Enable updates. When an official acts on your application, a local notification is shown.

## Tech stack

Vite + React 18 + TypeScript · Tailwind CSS with shadcn-style primitives on Radix (Dialog, Switch, Checkbox, Accordion, Tabs) · Motion (`motion/react`) through `LazyMotion` + `m.` components · vite-plugin-pwa (Workbox, `injectManifest`) · React Router with route-level code splitting and hover/touch preloading · Zustand (persisted) · Dexie (IndexedDB) · TanStack Query over a mock API with 300–600 ms latency · @tanstack/react-virtual · lucide-react · qrcode.react · Recharts · jsPDF · self-hosted Noto Sans and Noto Sans Devanagari.

```
src/
  app/        App root, router, AppShell (page transitions), lazy route registry
  routes/     Public and citizen pages; routes/gov/ for official dashboards
  components/ UI primitives (components/ui), shell (strip, header, tab bar, footer, splash), brand
  features/   Domain components: schemes, wallet, track timeline, official documents/PDF, gov helpers
  api/        Mock API layer (TanStack Query calls these); every write logs to the audit log
  db/         Dexie schema and deterministic seed data (12 schemes, 40 applications, 3 fraud cases)
  store/      Zustand stores: settings (persisted), session (persisted), UI
  i18n/       en.json, hi.json (Hindi loads on demand) and the useT() hook
  pwa/        Service worker, install-prompt capture, update and offline-queue manager
  lib/        Motion tokens, eligibility engine, formatting, hooks, reference data
```

### Notes on implementation choices

- **Motion features.** `domAnimation` does not include layout animations (`layoutId`) or drag, both of which the design needs (card-to-detail morph, tab pill, sheets, swipe rows). The app therefore loads `domMax` **asynchronously** through `LazyMotion`, so it never blocks first paint.
- **Splash.** The splash is static HTML/CSS in `index.html`, so it paints before any JavaScript. Spokes draw in with `stroke-dashoffset` on `pathLength="1"` lines, the wheel turns once and the tricolour sweeps. It shows once per session and can be skipped with a tap.
- **Prerendered landing page.** `npm run build` renders `/` to static HTML (`src/entry-server.tsx`, `scripts/prerender.mjs`), and the client hydrates it. This only applies to fresh, signed-out, English visits to `/`; every other case renders on the client.
- **Mock API and caching.** The API is local (IndexedDB), so Workbox runtime routes are set up for the URL patterns a real backend would use: `StaleWhileRevalidate` for `/api/schemes` and `/data/`, `NetworkFirst` for `/api/applications` and `/api/status`, and `CacheFirst` for images and lazily loaded chunks. The app shell, fonts and icons are precached.
- **Connected state.** Every official action writes to IndexedDB, adds a citizen notification and an audit entry, and invalidates queries. A `BroadcastChannel` refreshes other open tabs too.
- **PDF.** The on-screen acknowledgement and sanction order are bilingual. The downloadable PDF is English only, because jsPDF cannot shape Devanagari text.

## Quality checks (measured on this build)

- Lighthouse 12 (mobile, simulated throttling) on `/`: **Performance 94, Accessibility 100, Best Practices 100**; LCP 2.4 s, CLS 0. Lighthouse 12 no longer has a PWA category; Chrome reports **no installability errors** (`Page.getInstallabilityErrors`) and the service worker registers.
- First-load JavaScript: one 177 KB gzipped entry chunk (under the 200 KB budget). Charts, PDF, the Hindi strings and every route except Home are code-split.
- Reduced motion: movement is replaced with short opacity fades; gradient drift, wheel rotation and stamp motion are turned off.
- Accessibility: visible focus rings, 44 px touch targets, labelled inputs, `aria-live` for toasts and status changes, keyboard paths on official screens (in the queue, press **R** to recommend and **B** to send back), and a Screen Reader Access page.
