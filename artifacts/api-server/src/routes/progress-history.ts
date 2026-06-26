import { Router, type IRouter } from "express";
import { getDocs, queryDocs } from "@workspace/firestore";
import { ListProgressHistoryQueryParams } from "@workspace/api-zod";

interface ProgressHistoryDoc {
  numericId: number;
  studentId: number;
  courseId: number | null;
  unitId: number | null;
  chapterId: number | null;
  moduleId: number;
  previousRating: string | null;
  newRating: string;
  previousComment: string | null;
  newComment: string | null;
  changedBy: number | null;
  changedAt: string;
}
interface ModuleDoc { name: string; chapterId: number; numericId: number; }
interface ChapterDoc { name: string; unitId: number; numericId: number; }
interface UnitDoc { name: string; numericId: number; }
interface UserDoc { name: string | null; numericId: number; }

const router: IRouter = Router();

router.get("/progress-history", async (req, res): Promise<void> => {
  const query = ListProgressHistoryQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }

  const { studentId, moduleId } = query.data;

  const [historyDocs, allModules, allChapters, allUnits, allUsers] = await Promise.all([
    queryDocs<ProgressHistoryDoc>("progressHistory", "studentId", "==", studentId),
    getDocs<ModuleDoc>("modules"),
    getDocs<ChapterDoc>("chapters"),
    getDocs<UnitDoc>("units"),
    getDocs<UserDoc>("users"),
  ]);

  let history = historyDocs.sort((a, b) => b.changedAt.localeCompare(a.changedAt));
  if (moduleId) history = history.filter(h => h.moduleId === moduleId);

  const result = history.map(h => {
    const mod = allModules.find(m => m.numericId === h.moduleId);
    const chapter = mod ? allChapters.find(ch => ch.numericId === mod.chapterId) : undefined;
    const unit = chapter ? allUnits.find(u => u.numericId === chapter.unitId) : undefined;
    const changedByUser = h.changedBy ? allUsers.find(u => u.numericId === h.changedBy) : undefined;
    return {
      id: h.numericId,
      studentId: h.studentId,
      courseId: h.courseId ?? null,
      unitId: unit?.numericId ?? h.unitId ?? null,
      unitName: unit?.name ?? null,
      chapterId: chapter?.numericId ?? h.chapterId ?? null,
      chapterName: chapter?.name ?? null,
      moduleId: h.moduleId,
      moduleName: mod?.name ?? "",
      previousRating: h.previousRating ?? null,
      newRating: h.newRating,
      previousComment: h.previousComment ?? null,
      newComment: h.newComment ?? null,
      changedBy: h.changedBy ?? null,
      changedByName: changedByUser?.name ?? null,
      changedAt: h.changedAt,
    };
  });

  res.json(result);
});

export default router;
