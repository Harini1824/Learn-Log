---
name: Orval hook signatures
description: How Orval-generated React Query hooks accept parameters and options in this workspace.
---

Generated hooks that take a path parameter use a positional `id: number` — not an object like `{ id }` or `{ studentId }`.

**Correct:**
```ts
useGetStudentProgress(parseInt(id))
useGetTrainerDashboard(entityId ?? 0)
useGetCoordinatorDashboard(entityId ?? 0)
```

**Wrong:**
```ts
useGetStudentProgress({ studentId: parseInt(id) })  // TS error
useGetTrainerDashboard({ trainerId: entityId })       // TS error
```

The `enabled` option must go inside `{ query: UseQueryOptions }`, but `UseQueryOptions` requires `queryKey` — so passing `{ query: { enabled: false } }` causes a TS error. The practical workaround is to pass `id ?? 0` and let the API return a 404 gracefully when no ID is present (the UI shows empty/loading state).

**Why:** Orval generates `(id: number, options?: { query?: UseQueryOptions<...> })` where `UseQueryOptions` is the full TanStack Query v5 type that requires `queryKey`. There's no `Partial<>` wrapper.

**How to apply:** Any time you use a hook that takes a path param, pass the numeric ID directly. Use the `?? 0` fallback pattern for conditional fetching.
