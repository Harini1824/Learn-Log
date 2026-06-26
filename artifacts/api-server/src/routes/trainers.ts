import { Router, type IRouter } from "express";
import { getDocs, queryDocs, addDoc, nextId } from "@workspace/firestore";
import { CreateTrainerBody, GetTrainerParams, GetTrainerStatsParams, ListTrainersQueryParams } from "@workspace/api-zod";

interface TrainerDoc { name: string; phone: string | null; zoneId: number; centreName: string | null; numericId: number; }
interface ZoneDoc { name: string; numericId: number; }
interface StudentDoc { trainerId: number | null; numericId: number; }
interface ProgressDoc { studentId: number; rating: string; }
interface ModuleDoc { numericId: number; }

const router: IRouter = Router();

router.get("/trainers", async (req, res): Promise<void> => {
  const query = ListTrainersQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }

  const [allTrainers, allZones, allStudents] = await Promise.all([
    getDocs<TrainerDoc>("trainers"),
    getDocs<ZoneDoc>("zones"),
    getDocs<StudentDoc>("students"),
  ]);

  let trainers = allTrainers;
  if (query.data.zoneId) trainers = trainers.filter(t => t.zoneId === query.data.zoneId);
  trainers.sort((a, b) => a.name.localeCompare(b.name));

  res.json(trainers.map(t => ({
    id: t.numericId,
    name: t.name,
    phone: t.phone ?? null,
    zoneId: t.zoneId,
    zoneName: allZones.find(z => z.numericId === t.zoneId)?.name ?? "",
    centreName: t.centreName ?? null,
    studentCount: allStudents.filter(s => s.trainerId === t.numericId).length,
  })));
});

router.post("/trainers", async (req, res): Promise<void> => {
  const parsed = CreateTrainerBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const numericId = await nextId("trainers");
  const data: TrainerDoc = { name: parsed.data.name, phone: parsed.data.phone ?? null, zoneId: parsed.data.zoneId, centreName: parsed.data.centreName ?? null, numericId };
  const trainer = await addDoc("trainers", data);
  const zones = await queryDocs<ZoneDoc>("zones", "numericId", "==", trainer.zoneId);
  res.status(201).json({ id: trainer.numericId, name: trainer.name, phone: trainer.phone ?? null, zoneId: trainer.zoneId, zoneName: zones[0]?.name ?? "", centreName: trainer.centreName ?? null, studentCount: 0 });
});

router.get("/trainers/:id", async (req, res): Promise<void> => {
  const params = GetTrainerParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [trainers, zones, students] = await Promise.all([
    queryDocs<TrainerDoc>("trainers", "numericId", "==", params.data.id),
    getDocs<ZoneDoc>("zones"),
    queryDocs<StudentDoc>("students", "trainerId", "==", params.data.id),
  ]);
  const t = trainers[0];
  if (!t) { res.status(404).json({ error: "Trainer not found" }); return; }
  res.json({ id: t.numericId, name: t.name, phone: t.phone ?? null, zoneId: t.zoneId, zoneName: zones.find(z => z.numericId === t.zoneId)?.name ?? "", centreName: t.centreName ?? null, studentCount: students.length });
});

router.get("/trainers/:id/stats", async (req, res): Promise<void> => {
  const params = GetTrainerStatsParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [trainers, allStudents, allModules, allProgress] = await Promise.all([
    queryDocs<TrainerDoc>("trainers", "numericId", "==", params.data.id),
    getDocs<StudentDoc>("students"),
    getDocs<ModuleDoc>("modules"),
    getDocs<ProgressDoc>("progress"),
  ]);
  const trainer = trainers[0];
  if (!trainer) { res.status(404).json({ error: "Trainer not found" }); return; }

  const students = allStudents.filter(s => s.trainerId === trainer.numericId);
  const studentCount = students.length;
  const studentIds = students.map(s => s.numericId);
  const totalSlots = studentCount * allModules.length;
  const doneCount = allProgress.filter(p => studentIds.includes(p.studentId) && p.rating === "independent").length;
  const completionRate = totalSlots > 0 ? Math.round((doneCount / totalSlots) * 100) : 0;
  res.json({ trainerId: trainer.numericId, name: trainer.name, studentCount, completionRate });
});

export default router;
