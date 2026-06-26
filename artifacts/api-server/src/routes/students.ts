import { Router, type IRouter } from "express";
import { getDocs, queryDocs, addDoc, nextId } from "@workspace/firestore";
import { CreateStudentBody, GetStudentParams, GetStudentProgressParams, ListStudentsQueryParams } from "@workspace/api-zod";
import { writeAuditLog } from "../lib/audit-log";

interface StudentDoc { name: string; email: string | null; phone: string; courseId: number; timing: string | null; centreName: string | null; trainerId: number | null; numericId: number; }
interface TrainerDoc { name: string; zoneId: number; numericId: number; }
interface ZoneDoc { name: string; numericId: number; }
interface CourseDoc { name: string; syllabus: string | null; numericId: number; }
interface UnitDoc { courseId: number; name: string; orderIndex: number; numericId: number; }
interface ChapterDoc { unitId: number; name: string; orderIndex: number; numericId: number; }
interface ModuleDoc { chapterId: number; name: string; orderIndex: number; numericId: number; }
interface ProgressDoc { studentId: number; moduleId: number; trainerId: number | null; rating: string; comments?: string | null; submittedAt: string; updatedAt?: string; numericId: number; }

const router: IRouter = Router();

async function buildStudentRow(s: StudentDoc, allCourses: CourseDoc[], allTrainers: TrainerDoc[], allZones: ZoneDoc[]) {
  const course = allCourses.find(c => c.numericId === s.courseId);
  let trainerName: string | null = null;
  let zoneId: number | null = null;
  let zoneName: string | null = null;
  if (s.trainerId) {
    const trainer = allTrainers.find(t => t.numericId === s.trainerId);
    if (trainer) {
      trainerName = trainer.name;
      zoneId = trainer.zoneId;
      zoneName = allZones.find(z => z.numericId === trainer.zoneId)?.name ?? null;
    }
  }
  return { id: s.numericId, name: s.name, email: s.email ?? null, phone: s.phone, courseId: s.courseId, courseName: course?.name ?? "", timing: s.timing ?? null, centreName: s.centreName ?? null, trainerId: s.trainerId ?? null, trainerName, zoneId, zoneName };
}

router.get("/students", async (req, res): Promise<void> => {
  const query = ListStudentsQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }

  const [allStudents, allCourses, allTrainers, allZones] = await Promise.all([
    getDocs<StudentDoc>("students"),
    getDocs<CourseDoc>("courses"),
    getDocs<TrainerDoc>("trainers"),
    getDocs<ZoneDoc>("zones"),
  ]);

  let students = allStudents.sort((a, b) => a.name.localeCompare(b.name));
  if (query.data.trainerId) students = students.filter(s => s.trainerId === query.data.trainerId);
  if (query.data.courseId) students = students.filter(s => s.courseId === query.data.courseId);
  if (query.data.search) {
    const q = query.data.search.toLowerCase();
    students = students.filter(s => s.name.toLowerCase().includes(q) || s.phone.includes(q));
  }
  if (query.data.zoneId) {
    const zoneTrainerIds = allTrainers.filter(t => t.zoneId === query.data.zoneId).map(t => t.numericId);
    students = students.filter(s => s.trainerId && zoneTrainerIds.includes(s.trainerId));
  }

  const result = await Promise.all(students.map(s => buildStudentRow(s, allCourses, allTrainers, allZones)));
  res.json(result);
});

router.post("/students", async (req, res): Promise<void> => {
  const parsed = CreateStudentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const numericId = await nextId("students");
  const data: StudentDoc = { name: parsed.data.name, email: parsed.data.email ?? null, phone: parsed.data.phone, courseId: parsed.data.courseId, timing: parsed.data.timing ?? null, centreName: parsed.data.centreName ?? null, trainerId: parsed.data.trainerId ?? null, numericId };
  const student = await addDoc("students", data);
  const [allCourses, allTrainers, allZones] = await Promise.all([getDocs<CourseDoc>("courses"), getDocs<TrainerDoc>("trainers"), getDocs<ZoneDoc>("zones")]);
  const row = await buildStudentRow(student, allCourses, allTrainers, allZones);

  writeAuditLog({
    userId: null,
    userName: null,
    role: null,
    action: "student_created",
    entityType: "student",
    entityId: numericId,
    oldValue: null,
    newValue: JSON.stringify({ name: parsed.data.name, phone: parsed.data.phone }),
    ipAddress: null,
  });

  res.status(201).json(row);
});

router.get("/students/:id", async (req, res): Promise<void> => {
  const params = GetStudentParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [students, allCourses, allTrainers, allZones] = await Promise.all([
    queryDocs<StudentDoc>("students", "numericId", "==", params.data.id),
    getDocs<CourseDoc>("courses"),
    getDocs<TrainerDoc>("trainers"),
    getDocs<ZoneDoc>("zones"),
  ]);
  const student = students[0];
  if (!student) { res.status(404).json({ error: "Student not found" }); return; }

  const course = allCourses.find(c => c.numericId === student.courseId);
  let trainerName: string | null = null, zoneId: number | null = null, zoneName: string | null = null;
  if (student.trainerId) {
    const trainer = allTrainers.find(t => t.numericId === student.trainerId);
    if (trainer) { trainerName = trainer.name; zoneId = trainer.zoneId; zoneName = allZones.find(z => z.numericId === trainer.zoneId)?.name ?? null; }
  }
  res.json({ id: student.numericId, name: student.name, email: student.email ?? null, phone: student.phone, courseId: student.courseId, courseName: course?.name ?? "", courseSyllabus: course?.syllabus ?? null, timing: student.timing ?? null, centreName: student.centreName ?? null, trainerId: student.trainerId ?? null, trainerName, zoneId, zoneName });
});

router.get("/students/:id/progress", async (req, res): Promise<void> => {
  const params = GetStudentProgressParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [students, allCourses, allUnits, allChapters, allModules, allProgress] = await Promise.all([
    queryDocs<StudentDoc>("students", "numericId", "==", params.data.id),
    getDocs<CourseDoc>("courses"),
    getDocs<UnitDoc>("units"),
    getDocs<ChapterDoc>("chapters"),
    getDocs<ModuleDoc>("modules"),
    queryDocs<ProgressDoc>("progress", "studentId", "==", params.data.id),
  ]);

  const student = students[0];
  if (!student) { res.status(404).json({ error: "Student not found" }); return; }

  const course = allCourses.find(c => c.numericId === student.courseId);
  const courseUnits = allUnits.filter(u => u.courseId === student.courseId).sort((a, b) => a.orderIndex - b.orderIndex);

  const courseModuleIds = new Set<number>();
  courseUnits.forEach(u => {
    allChapters.filter(ch => ch.unitId === u.numericId).forEach(ch => {
      allModules.filter(m => m.chapterId === ch.numericId).forEach(m => courseModuleIds.add(m.numericId));
    });
  });

  const totalModules = courseModuleIds.size;
  const completedModules = allProgress.filter(p => p.rating === "independent").length;
  const completionRate = totalModules > 0 ? Math.round((allProgress.length / totalModules) * 100) : 0;

  const units = courseUnits.map(unit => {
    const chapters = allChapters.filter(ch => ch.unitId === unit.numericId).sort((a, b) => a.orderIndex - b.orderIndex);
    return {
      unitId: unit.numericId,
      unitName: unit.name,
      chapters: chapters.map(chapter => {
        const modules = allModules.filter(m => m.chapterId === chapter.numericId).sort((a, b) => a.orderIndex - b.orderIndex);
        return {
          chapterId: chapter.numericId,
          chapterName: chapter.name,
          modules: modules.map(mod => {
            const progress = allProgress.find(p => p.moduleId === mod.numericId);
            return {
              moduleId: mod.numericId,
              moduleName: mod.name,
              rating: progress?.rating ?? null,
              comments: progress?.comments ?? null,
              trainerId: progress?.trainerId ?? null,
              submittedAt: progress?.submittedAt ?? null,
              updatedAt: progress?.updatedAt ?? null,
            };
          }),
        };
      }),
    };
  });

  res.json({ student: { id: student.numericId, name: student.name, phone: student.phone, courseName: course?.name ?? "", timing: student.timing ?? null, centreName: student.centreName ?? null }, completionRate, completedModules, totalModules, units });
});

export default router;
