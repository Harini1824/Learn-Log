---
name: Student progress response shape
description: The shape of the student progress API response — hierarchical, not flat.
---

`GET /api/students/:id/progress` returns a hierarchical structure:

```ts
{
  student: { id, name, phone, courseName, timing, centreName },
  completionRate: number,        // percentage of modules rated
  completedModules: number,      // count rated "independent"
  totalModules: number,
  units: [
    {
      unitId, unitName,
      chapters: [
        {
          chapterId, chapterName,
          modules: [
            { moduleId, moduleName, rating: string|null, trainerId: number|null, submittedAt: string|null }
          ]
        }
      ]
    }
  ]
}
```

**Why:** The frontend pages (student detail, trainer update, coordinator update) render module ratings inside a unit → chapter hierarchy. The flat `ratings[]` shape from the original spec couldn't support this without N+1 fetches.

**How to apply:** When building pages that show a student's progress, iterate `data.units → .chapters → .modules`. Access student info via `data.student.*` not `data.studentName`. Access completion via `data.completionRate`.
