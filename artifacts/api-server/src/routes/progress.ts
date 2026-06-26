import { Router, type IRouter } from "express";
import { getDocs, queryDocs, addDoc, updateDoc, nextId, db } from "@workspace/firestore";
import { SubmitProgressBody, ListProgressQueryParams } from "@workspace/api-zod";
import { writeAuditLog } from "../lib/audit-log";

interface ProgressDoc { studentId: number; moduleId: number; trainerId: number | null; rating: string; comments: string | null; submittedAt: string; updatedAt: string; updatedBy: number | null; numericId: number; }
interface StudentDoc { name: string; numericId: number; }
interface TrainerDoc { name: string; numericId: number; }
interface ModuleDoc { name: string; chapterId: number; numericId: number; }
interface ChapterDoc { name: string; unitId: number; numericId: number; }
interface UnitDoc { name: string; numericId: number; }
interface ProgressHistoryDoc { numericId: number; studentId: number; courseId: number | null; unitId: number | null; chapterId: number | null; moduleId: number; previousRating: string | null; newRating: string; previousComment: string | null; newComment: string | null; changedBy: number | null; changedAt: string; }

const router: IRouter = Router();

async function buildProgressRow(p: ProgressDoc & { id: string }, allStudents: (StudentDoc & { id: string })[], allTrainers: (TrainerDoc & { id: string })[], allModules: (ModuleDoc & { id: string })[], allChapters: (ChapterDoc & { id: string })[], allUnits: (UnitDoc & { id: string })[]) {
  const student = allStudents.find(s => s.numericId === p.studentId);
  const mod = allModules.find(m => m.numericId === p.moduleId);
  const chapter = mod ? allChapters.find(ch => ch.numericId === mod.chapterId) : undefined;
  const unit = chapter ? allUnits.find(u => u.numericId === chapter.unitId) : undefined;
  const trainer = p.trainerId ? allTrainers.find(t => t.numericId === p.trainerId) : undefined;
  return {
    id: p.numericId,
    studentId: p.studentId,
    studentName: student?.name ?? "",
    trainerId: p.trainerId ?? null,
    trainerName: trainer?.name ?? null,
    moduleId: p.moduleId,
    moduleName: mod?.name ?? "",
    chapterName: chapter?.name ?? "",
    unitName: unit?.name ?? "",
    rating: p.rating,
    comments: p.comments ?? null,
    submittedAt: p.submittedAt,
    updatedAt: p.updatedAt ?? null,
  };
}

router.get("/progress", async (req, res): Promise<void> => {
  const query = ListProgressQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }

  const [allProgress, allStudents, allTrainers, allModules, allChapters, allUnits] = await Promise.all([
    getDocs<ProgressDoc>("progress"),
    getDocs<StudentDoc>("students"),
    getDocs<TrainerDoc>("trainers"),
    getDocs<ModuleDoc>("modules"),
    getDocs<ChapterDoc>("chapters"),
    getDocs<UnitDoc>("units"),
  ]);

  let rows = allProgress.sort((a, b) => (b.updatedAt ?? b.submittedAt).localeCompare(a.updatedAt ?? a.submittedAt));
  if (query.data.studentId) rows = rows.filter(r => r.studentId === query.data.studentId);
  if (query.data.trainerId) rows = rows.filter(r => r.trainerId === query.data.trainerId);

  const result = await Promise.all(rows.map(p => buildProgressRow(p, allStudents, allTrainers, allModules, allChapters, allUnits)));
  res.json(result);
});

router.post("/progress", async (req, res): Promise<void> => {
  const parsed = SubmitProgressBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { studentId, moduleId, trainerId, rating, comments } = parsed.data;
  const now = new Date().toISOString();
  const trimmedComments = comments?.trim().slice(0, 500) ?? null;

  const snap = await db.collection("progress")
    .where("studentId", "==", studentId)
    .where("moduleId", "==", moduleId)
    .get();

  const [allStudents, allTrainers, allModules, allChapters, allUnits] = await Promise.all([
    getDocs<StudentDoc>("students"),
    getDocs<TrainerDoc>("trainers"),
    getDocs<ModuleDoc>("modules"),
    getDocs<ChapterDoc>("chapters"),
    getDocs<UnitDoc>("units"),
  ]);

  const trainer = trainerId ? allTrainers.find(t => t.numericId === trainerId) : undefined;
  const student = allStudents.find(s => s.numericId === studentId);
  const mod = allModules.find(m => m.numericId === moduleId);
  const chapter = mod ? allChapters.find(ch => ch.numericId === mod.chapterId) : undefined;
  const unit = chapter ? allUnits.find(u => u.numericId === chapter.unitId) : undefined;

  let record: ProgressDoc & { id: string };
  let isUpdate = false;
  let previousRating: string | null = null;
  let previousComment: string | null = null;

  if (!snap.empty) {
    isUpdate = true;
    const docRef = snap.docs[0];
    const existing = docRef.data() as ProgressDoc;
    previousRating = existing.rating ?? null;
    previousComment = existing.comments ?? null;

    await updateDoc("progress", docRef.id, {
      rating,
      comments: trimmedComments,
      trainerId: trainerId ?? null,
      updatedAt: now,
      updatedBy: trainerId ?? null,
    });
    record = { id: docRef.id, ...existing, rating, comments: trimmedComments, trainerId: trainerId ?? null, updatedAt: now, updatedBy: trainerId ?? null };
  } else {
    const numericId = await nextId("progress");
    const data: ProgressDoc = {
      studentId, moduleId,
      trainerId: trainerId ?? null,
      rating,
      comments: trimmedComments,
      submittedAt: now,
      updatedAt: now,
      updatedBy: trainerId ?? null,
      numericId,
    };
    record = await addDoc("progress", data);
  }

  // Write progress history entry
  const historyId = await nextId("progressHistory");
  const historyDoc: ProgressHistoryDoc = {
    numericId: historyId,
    studentId,
    courseId: null,
    unitId: unit?.numericId ?? null,
    chapterId: chapter?.numericId ?? null,
    moduleId,
    previousRating: isUpdate ? previousRating : null,
    newRating: rating,
    previousComment: isUpdate ? previousComment : null,
    newComment: trimmedComments,
    changedBy: trainerId ?? null,
    changedAt: now,
  };
  await addDoc("progressHistory", historyDoc);

  // Write audit log
  writeAuditLog({
    userId: trainerId ?? null,
    userName: trainer?.name ?? null,
    role: trainerId ? "trainer" : null,
    action: isUpdate ? "progress_update" : "progress_create",
    entityType: "progress",
    entityId: record.numericId,
    oldValue: isUpdate ? JSON.stringify({ rating: previousRating, comments: previousComment }) : null,
    newValue: JSON.stringify({ rating, comments: trimmedComments, studentName: student?.name, moduleName: mod?.name }),
    ipAddress: null,
  });

  const row = await buildProgressRow(record, allStudents, allTrainers, allModules, allChapters, allUnits);
  res.status(201).json(row);
});

export default router;
