# TN Learning Tracker

A full-stack Learning Tracker app for a Tamil Nadu disability skills training organisation. Users log in with an Indian phone number + 4-digit PIN and select their role to access a role-specific dashboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/learning-tracker run dev` — run the frontend (port 18714)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/scripts run seed-firestore` — wipe and reseed all Firestore collections
- Required env: `FIREBASE_SERVICE_ACCOUNT` — full Firebase service account JSON (from Firebase Console → Project settings → Service accounts)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, shadcn/ui, TanStack Query, Wouter routing
- API: Express 5
- DB: Firebase Firestore (via `firebase-admin`) — no SQL, no migrations
- Validation: Zod (`zod/v4`)
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — Single source of truth for all API contracts
- `lib/api-client-react/src/generated/` — Generated React Query hooks (do not edit manually)
- `lib/api-zod/src/generated/` — Generated Zod validation schemas (do not edit manually)
- `lib/firestore/src/index.ts` — Firestore Admin SDK init + typed helpers (getDocs, queryDocs, addDoc, setDoc, updateDoc, nextId)
- `scripts/src/seed-firestore.ts` — Seed script (clears + repopulates all collections)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/learning-tracker/src/pages/` — React pages (organized by role)
- `artifacts/learning-tracker/src/lib/auth.tsx` — Auth context (role, entityId, phone, name)

## Architecture decisions

- **Contract-first API**: OpenAPI spec is written first; Orval generates React Query hooks and Zod validators. Never edit generated files.
- **Role-based routing**: After login → role selection page → role-specific dashboard (management/coordinator/trainer/student).
- **Progress upsert pattern**: `POST /api/progress` always upserts (update if student+module exists, else insert).
- **Flat student list, hierarchical progress**: Students list endpoint returns flat rows; progress endpoint returns hierarchical unit → chapter → module structure.
- **Trainer student count**: Computed at query time — trainers list fetches all students and counts per trainer.

## Product

- **Login**: Indian phone (+91 prefix) + 4-digit PIN. Supports registration (first time) and sign-in.
- **Role Selection**: Management, Zonal Coordinator, Trainer, Student — each routes to a different dashboard.
- **Management**: View org-wide stats (students, trainers, coordinators, zones, centres, completion rate), register new entities, view all progress.
- **Coordinator**: View zone stats (students, trainers, completion rate, trainer performance), browse students, update progress.
- **Trainer**: View personal stats, browse assigned students, update module ratings with autocomplete search.
- **Student**: View own course progress (unit → chapter → module hierarchy with ratings).
- **Progress rating scale**: Totally Dependent → Physical Prompting → Verbal Prompting → Clueing → Independent.

## Seed Data

- **8 zones** across Tamil Nadu
- **8 zonal coordinators**, **32 trainers** (4 per zone)
- **1 course**: Web Accessibility Testing (Unit 1 → Chapter 1 → 3 modules)
- **14 locations/centres**, **8 sample students**, **13 progress records**
- **Login accounts** (all PIN: `1234`):
  - Management: `9000000000`
  - Trainer: `9111111111` (Mr. Ramkumar, Zone 1)
  - Coordinator: `9222222222` (Mr. Bhuvaneshan, Zone 1)
  - Student: `9876543210` (Priya Lakshmi)

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after editing `openapi.yaml` — generated files are consumed by both frontend (hooks) and backend (Zod validators).
- The `useGetStudentProgress`, `useGetTrainerDashboard`, `useGetCoordinatorDashboard` hooks take `(id: number, options?)` — **not** `({ id }, options?)`.
- `ListStudentsParams` uses `search` (not `q`) for the text search filter.
- Do not add `coordinatorId` to student or trainer list params — it's not in the OpenAPI spec. Use `zoneId` instead for zone-level filtering.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
