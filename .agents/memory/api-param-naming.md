---
name: API param naming conventions
description: Query param names and available filters on list endpoints in this workspace.
---

**Students list (`GET /api/students`):**
- `trainerId?: number` — filter by trainer
- `zoneId?: number` — filter by zone (via trainer's zone)
- `courseId?: number` — filter by course
- `search?: string` — text search on name and phone (NOT `q`)
- No `coordinatorId` param — coordinators must filter by `zoneId` instead

**Trainers list (`GET /api/trainers`):**
- `zoneId?: number` — filter by zone
- No `coordinatorId` param

**Why:** The OpenAPI spec and generated Zod schemas define these exact field names. Using `q` instead of `search` returns all results unfiltered; using `coordinatorId` causes a TypeScript error.

**How to apply:** In `useListStudents({ search: searchTerm })` not `{ q: searchTerm }`. For coordinator views, pass `zoneId` if you need zone-level filtering, or fetch all and filter client-side.
