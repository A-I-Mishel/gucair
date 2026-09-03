# GUCAIR — Global University Consortium of AI Readiness

**Live:** https://gucair.vercel.app · **Repo:** https://github.com/A-I-Mishel/gucair

## What is this website?

GUCAIR is a collaborative platform where universities worldwide **assess, benchmark, and improve their AI readiness**. A member university answers a structured 22-question assessment across five pillars, consortium admins validate the submission, and the university appears on global and regional rankings with trend tracking, peer benchmarking, and PDF reports.

The pilot phase ships with **51 real member universities** across all six regions, a 22-question assessment framework, three launch articles, and a full admin back office.

## What is used (tech stack)

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript (strict) + Tailwind CSS |
| UI | shadcn-style components + Radix UI primitives (toasts, etc.) |
| Database | Firebase Firestore (Spark plan — free, no Blaze needed) |
| Auth | Firebase Auth (email/password + Google) + custom claims for roles |
| Backend | Next.js API routes only (`/api/admin/*`) — **no Cloud Functions** |
| Image uploads | Cloudinary (free-tier unsigned preset) |
| Charts | Recharts (radar, bars, trends) |
| Maps | Leaflet (dynamic import, bundled stylesheet) |
| PDF reports | html2canvas + jspdf (100% client-side) |
| Articles CMS | TipTap rich-text editor (HTML output) |
| State | TanStack Query (server state) + Zustand (client state) |
| Forms | React Hook Form + Zod validation |
| CSV parsing | PapaParse (server-side) |
| Deployment | Vercel (frontend + API routes), Firebase (Auth + Firestore) |

## How it works

### The three roles

| Role | How you get it | What you can do |
|---|---|---|
| **Public visitor** | Just open the site | Browse rankings, directory, map, profiles, news, methodology; apply via Join form |
| **University rep** (`rep`) | Admin links your account to a university | Fill the 5-step assessment wizard (auto-save drafts, Cloudinary evidence), submit for review, benchmark against 3–5 peers with radar/bar charts, export PDF reports |
| **Admin** (`admin`) | Promoted via `npm run promote` | Approve/suspend universities, validate/reject assessments, manage users and roles, publish articles, bulk-import via JSON/CSV/manual, recalculate rankings |

Roles live in Firebase Auth **custom claims** (`role`, plus `universityId` for reps), mirrored in `/users/{uid}`. Route protection is client-side via `<RoleGuard role="rep"|"admin">` — tokens are never verified in Middleware (Admin SDK can't run on the Edge). After a role change, sign out/in to refresh claims.

### The assessment pipeline

1. **Rep answers 22 questions** (5 pillars) in the wizard — numeric answers, notes, optional Cloudinary evidence uploads. Drafts auto-save every 30 seconds with version tracking (`version`, `previousAssessmentId`).
2. **Submit** computes weighted scores **client-side** (`src/lib/scoring.ts`): each pillar = Σ(answer/maxScore × weight)/Σ(weight) × 100; overall = 0.25·Research + 0.25·Curriculum + 0.20·Infrastructure + 0.15·Ethics + 0.15·Industry. Then it triggers a recalculation.
3. **Admin validates** in `/admin/assessments` (approve → `validated`, or send back to `draft` with notes).
4. **Recalculation** (`POST /api/admin/recalculate`) rebuilds the pre-computed `stats/singleton` and `rankings/{region}` docs — the public pages read these, so rankings load instantly with zero aggregation at request time.

### The data model (Firestore)

- `universities/{id}` — profile + `score: number | null` (`null` = awaiting first assessment, shown gray), `pillarScores`, `assessmentCount`, `status` (`pending`|`approved`|`suspended`), Cloudinary `logoUrl`
- `assessments/{id}` — `universityId`, `userId`, version chain, `status` (`draft`|`submitted`|`validated`), computed scores, `responses[]` with evidence URLs and notes
- `users/{uid}` — `email`, `name`, `role` (`public`|`rep`|`admin`), `universityId?`
- `questions/{id}` — the 22 framework questions (pillar, text, maxScore, weight, order, evidenceRequired)
- `articles/{id}` — TipTap HTML content, slug, tags, `draft`|`published`
- `stats/singleton`, `rankings/{region}` — pre-computed aggregates (publicly readable, never client-written)

### Getting real data in (no external APIs, no hardcoded data)

`/admin/setup` offers three methods — the admin picks whichever works:

1. **Method 1 — JSON seed (recommended):** `POST /api/admin/seed-json` reads `data/seed-universities.json` (a plain data file, not code — 51 real universities with verified coordinates) and creates approved docs. Idempotent on name+country.
2. **Method 2 — CSV upload:** `POST /api/admin/upload-csv` parses an admin spreadsheet with PapaParse, validates each row, skips/reports failures. Template: `public/bulk-import-template.csv`.
3. **Method 3 — Manual form:** `POST /api/admin/add-university`, Zod-validated, 409 on duplicates.

Then "Create Assessment Framework" (`seed-questions`, idempotent) and "Recalculate Rankings".

### Security model

- `firestore.rules` enforces everything server-side: public reads only for approved universities, published articles, validated assessments, stats, and rankings; reps can only touch their own university's drafts; all writes to aggregates are denied (Admin SDK only).
- All `/api/admin/*` routes require a Bearer ID token with `role: "admin"` (401/403 otherwise).
- First-login self-provisioning lets anyone create **only their own** `/users` doc as `role: "public"`; elevation is admin-only.

## Project structure

```text
data/seed-universities.json      # 51 real universities (data, not code)
src/app/(public)/                # /, /about, /methodology, /rankings,
                                 # /universities, /universities/[id] (ISR),
                                 # /news, /news/[slug] (ISR), /contact
src/app/(auth)/                  # /login, /register, /forgot-password
src/app/dashboard/               # rep overview, assessment wizard, benchmark
src/app/admin/                   # overview, setup, universities, assessments,
                                 # users, articles (TipTap CMS)
src/app/api/admin/               # seed-questions, seed-json, upload-csv,
                                 # add-university, set-role, recalculate
src/components/                  # RoleGuard, charts, map, rankings, ui, layout
src/hooks/  src/lib/  src/store/ # TanStack Query hooks, firebase, scoring,
                                 # auth-context, Cloudinary, PDF, utils
src/types/                       # all Firestore document interfaces
scripts/                         # ops tools (see below)
firestore.rules / firestore.indexes.json / firebase.json
```

Public article/profile pages use ISR (`revalidate = 3600`); interactive pages use TanStack Query; the Leaflet map is dynamically imported so it never touches SSR.

## Local development

```bash
cp .env.local.example .env.local   # fill Firebase + Cloudinary values
npm install
npm run dev                        # http://localhost:3000
```

Firebase Console prerequisites: Auth providers (Email/Password + Google), a Firestore database, and your `localhost` + production domains under Authentication → Authorized domains. Deploy rules/indexes with `firebase deploy --only firestore:rules,firestore:indexes` (Firebase CLI login required once).

First admin: register an account, then `npm run promote -- you@mail --role admin`, sign out/in, open `/admin/setup`.

## Ops scripts (`npm run <name>`)

| Script | Purpose |
|---|---|
| `seed:questions` | Seed the 22 framework questions (local alternative to the API) |
| `promote -- --list` / `user@mail --role admin\|rep [--universityId id]` | List users / set roles + claims |
| `onboard -- --name … --repEmail …` | Approved university + linked rep account in one step |
| `demo:pipeline` / `cleanup:demo` | Labeled demo assessment lifecycle (provisional data helpers) |
| `submit-assessment -- --universityId id --answers "…22 numbers…" [--validate]` | Submit versioned, scored assessments from real answers |
| `submit-provisional` | Labeled provisional ranking seed (demo phase) |
| `set-password -- user@mail newPass` | Reset a user's password |
| `status` | Collection counts + rankings health check |
| `dev` / `build` / `typecheck` | Run, production build, strict type check |

## Deploying (GitHub → Vercel)

1. Push `main` to GitHub (`.env.local` is gitignored and never committed).
2. Vercel → Import repo (Next.js preset, no setting changes).
3. Add environment variables: all `NEXT_PUBLIC_*` (Firebase public config + Cloudinary) **plus** `FIREBASE_ADMIN_*` (the API routes need the service account server-side).
4. Deploy, then add the `*.vercel.app` domain to Firebase Auth authorized domains.
5. (Optional) Vercel project → Settings → Git → connect the repo for auto-deploys on push.

## Current data state & honesty notes

- **51 member universities**, 22 questions, 3 launch articles are live in production Firestore.
- Rankings blend **validated rep assessments with provisional admin estimates**. Every provisional answer is labeled in its notes, and the rankings page carries a pilot-phase disclosure banner. Provisional rows are automatically superseded when reps submit verified assessments (latest validated version wins).
- Scores of `null` render as gray "awaiting assessment" states everywhere — this is correct behavior, not missing data handling.

## Roadmap ideas

Rep invitations for all 51 members · assessment reminders · regional admin roles · article comments · email notifications (SendGrid hook points exist in functions history) · Lighthouse ≥90 pass · automated test suite.
