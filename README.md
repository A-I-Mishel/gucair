# GUCAIR — Global University Consortium of AI Readiness

Spark-plan full-stack platform: universities assess, benchmark, and improve AI readiness across five pillars.
No Cloud Functions, no Firebase Storage — backend is **Next.js API routes + Firestore + Cloudinary**.

## Architecture

- **Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind, shadcn-style + Radix primitives
- **Backend:** Next.js API routes only (`/api/admin/*`, Firebase Admin SDK server-side)
- **Database:** Firestore (client SDK reads, Admin SDK writes for aggregates)
- **Auth:** Firebase Auth (email/password + Google) + custom claims (`public` | `rep` | `admin`)
- **Uploads:** Cloudinary unsigned preset (`gucair/logos`, `gucair/evidence`, `gucair/articles`)
- **Charts:** Recharts · **Maps:** Leaflet · **PDF:** html2canvas + jspdf (client-side)
- **Editor:** TipTap (articles CMS, HTML output)

### Collections

- `universities/{id}` — name, country, region, city, lat, lng, website?, type, studentCount?, facultyCount?, year?, status (`pending`|`approved`|`suspended`), representatives[], score? (null until assessed), pillarScores?, assessmentCount, logoUrl?
- `assessments/{id}` — universityId, userId, version, previousAssessmentId?, status (`draft`|`submitted`|`validated`), pillarScores, overallScore (computed **client-side** on submit), responses[], submittedAt
- `users/{uid}` — email, name, role (`public`|`rep`|`admin`), universityId?
- `questions/{id}` — pillar, text, description, maxScore, weight, order, evidenceRequired
- `articles/{id}` — title, slug, content (HTML), excerpt, authorId, imageUrl?, tags[], status, publishedAt
- `stats/singleton` — totalUniversities, totalAssessments, avgScore?, topUniversities[], regionAvgs{}, updatedAt
- `rankings/{region}` — region, list[{rank, id, name, country, score}], updatedAt

### API routes (all admin-gated via Bearer ID token)

| Route | Purpose |
|---|---|
| `POST /api/admin/seed-questions` | Idempotent creation of the 22 questions |
| `POST /api/admin/seed-json` | **Method 1 (recommended):** reads `data/seed-universities.json` (data file, not code), idempotent on name+country |
| `POST /api/admin/upload-csv` | **Method 2:** multipart `file` (.csv) parsed with papaparse; invalid rows skipped + reported |
| `POST /api/admin/add-university` | **Method 3:** single Zod-validated manual add (409 on duplicate) |
| `POST /api/admin/set-role` | `{uid, role, universityId?}` → custom claims + `/users` mirror + token revocation |
| `POST /api/admin/recalculate` | Rebuild `stats/singleton` + `rankings/*` (incl. pillar snapshots for table columns) |

### Auth & guards

Roles live in Auth custom claims; `/users/{uid}` mirrors them. Client route protection via `<RoleGuard role="rep"|"admin">` (`src/components/RoleGuard.tsx`). Never verify tokens in Middleware. After a role change, the user signs out/in (or `useAuth().refresh()`).
First-login self-provisioning: anyone may create **only their own** `/users` doc and **only** with `role: "public"` (lets Google sign-ins in; elevation stays admin-only).

## Setup

1. Firebase Console: enable Auth (Email/Password + Google) + Firestore. No Storage, no Functions, no Blaze needed.
2. `cp .env.local.example .env.local` and fill values (Firebase public config + `FIREBASE_ADMIN_*` service account + Cloudinary).
3. `npm install && npm run dev` (http://localhost:3000).
4. Register → promote yourself: `npm run promote -- you@mail --role admin` → sign out/in → open `/admin/setup`.
5. **Setup page (no external APIs, no hardcoded data in routes):**
   - "Seed Universities" reads `data/seed-universities.json` (16 real universities, data file — editable without touching code)
   - or upload your own CSV (template: `public/bulk-import-template.csv`), or add one-by-one via the manual form
   - "Create Assessment Framework" → "Recalculate Rankings".
6. Rules/indexes: `firebase deploy --only firestore:rules,firestore:indexes`.

## Real-data rule

No university data is hardcoded in source or API routes. `data/seed-universities.json` is a plain data file read at runtime; the CSV and manual methods take admin-supplied input only. Scores stay `null` (gray "Not assessed" state) until verified reps submit assessments.

## Scripts

- `dev` / `build` / `start` / `typecheck`
- `seed:questions` — same 22 questions as the API route (local alternative)
- `promote -- --list | user@mail --role admin|rep [--universityId id]`
- `onboard -- --name ... --repEmail ...` — approved university + rep account in one step
- `demo:pipeline -- --universityId id` — labeled demo assessment → score → validate → recompute
- `cleanup:demo -- --assessmentId id` — delete + rebuild aggregates
- `status` — collection counts + rankings health
- `migrate-schema` — one-time old→new schema migration (already run on `guiac-edac4`)

## Deploy (GitHub → Vercel)

1. `git init && git add . && git commit -m "GUCAIR"` (`.env.local` is gitignored) → push to GitHub.
2. Vercel → Import repo → add all `NEXT_PUBLIC_*` env vars. Add `FIREBASE_ADMIN_*` too (API routes need them server-side).
3. Deploy. Add your Vercel domain to Firebase Auth authorized domains.
