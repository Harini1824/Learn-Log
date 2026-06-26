import { Router, type IRouter } from "express";
import { getDocs, queryDocs, addDoc, nextId } from "@workspace/firestore";
import { CreateCourseBody, GetCourseParams } from "@workspace/api-zod";

interface CourseDoc { name: string; syllabus: string | null; numericId: number; }
interface UnitDoc { courseId: number; name: string; orderIndex: number; numericId: number; }
interface ChapterDoc { unitId: number; name: string; orderIndex: number; numericId: number; }
interface ModuleDoc { chapterId: number; name: string; orderIndex: number; numericId: number; }

const router: IRouter = Router();

router.get("/courses", async (_req, res): Promise<void> => {
  const courses = await getDocs<CourseDoc>("courses");
  courses.sort((a, b) => a.name.localeCompare(b.name));
  res.json(courses.map(c => ({ id: c.numericId, name: c.name, syllabus: c.syllabus })));
});

router.post("/courses", async (req, res): Promise<void> => {
  const parsed = CreateCourseBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const numericId = await nextId("courses");
  const course = await addDoc<CourseDoc>("courses", { name: parsed.data.name, syllabus: parsed.data.syllabus ?? null, numericId });
  res.status(201).json({ id: course.numericId, name: course.name, syllabus: course.syllabus });
});

router.get("/courses/:id", async (req, res): Promise<void> => {
  const params = GetCourseParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [courses, allUnits, allChapters, allModules] = await Promise.all([
    queryDocs<CourseDoc>("courses", "numericId", "==", params.data.id),
    getDocs<UnitDoc>("units"),
    getDocs<ChapterDoc>("chapters"),
    getDocs<ModuleDoc>("modules"),
  ]);

  const course = courses[0];
  if (!course) { res.status(404).json({ error: "Course not found" }); return; }

  const units = allUnits.filter(u => u.courseId === course.numericId).sort((a, b) => a.orderIndex - b.orderIndex);
  const unitData = units.map(u => {
    const chapters = allChapters.filter(ch => ch.unitId === u.numericId).sort((a, b) => a.orderIndex - b.orderIndex);
    return {
      id: u.numericId,
      name: u.name,
      orderIndex: u.orderIndex,
      chapters: chapters.map(ch => {
        const modules = allModules.filter(m => m.chapterId === ch.numericId).sort((a, b) => a.orderIndex - b.orderIndex);
        return { id: ch.numericId, name: ch.name, orderIndex: ch.orderIndex, modules: modules.map(m => ({ id: m.numericId, name: m.name, orderIndex: m.orderIndex })) };
      }),
    };
  });

  res.json({ id: course.numericId, name: course.name, syllabus: course.syllabus, units: unitData });
});

export default router;
