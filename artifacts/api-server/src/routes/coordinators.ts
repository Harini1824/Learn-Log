import { Router, type IRouter } from "express";
import { getDocs, queryDocs, addDoc, nextId } from "@workspace/firestore";
import { CreateCoordinatorBody, GetCoordinatorParams, GetCoordinatorStatsParams } from "@workspace/api-zod";

interface CoordinatorDoc { name: string; phone: string | null; zoneId: number; numericId: number; }
interface ZoneDoc { name: string; numericId: number; }
interface TrainerDoc { name: string; zoneId: number; numericId: number; }
interface StudentDoc { trainerId: number | null; numericId: number; }
interface ProgressDoc { studentId: number; rating: string; }
interface ModuleDoc { numericId: number; }

const router: IRouter = Router();

router.get("/coordinators", async (_req, res): Promise<void> => {
  const [coords, zones] = await Promise.all([
    getDocs<CoordinatorDoc>("coordinators"),
    getDocs<ZoneDoc>("zones"),
  ]);
  coords.sort((a, b) => a.name.localeCompare(b.name));
  res.json(coords.map(c => ({
    id: c.numericId,
    name: c.name,
    phone: c.phone ?? null,
    zoneId: c.zoneId,
    zoneName: zones.find(z => z.numericId === c.zoneId)?.name ?? "",
  })));
});

router.post("/coordinators", async (req, res): Promise<void> => {
  const parsed = CreateCoordinatorBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const numericId = await nextId("coordinators");
  const data: CoordinatorDoc = { name: parsed.data.name, phone: parsed.data.phone ?? null, zoneId: parsed.data.zoneId, numericId };
  const coord = await addDoc("coordinators", data);
  const zones = await queryDocs<ZoneDoc>("zones", "numericId", "==", coord.zoneId);
  res.status(201).json({ id: coord.numericId, name: coord.name, phone: coord.phone ?? null, zoneId: coord.zoneId, zoneName: zones[0]?.name ?? "" });
});

router.get("/coordinators/:id", async (req, res): Promise<void> => {
  const params = GetCoordinatorParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [coords, zones] = await Promise.all([
    queryDocs<CoordinatorDoc>("coordinators", "numericId", "==", params.data.id),
    getDocs<ZoneDoc>("zones"),
  ]);
  const c = coords[0];
  if (!c) { res.status(404).json({ error: "Coordinator not found" }); return; }
  res.json({ id: c.numericId, name: c.name, phone: c.phone ?? null, zoneId: c.zoneId, zoneName: zones.find(z => z.numericId === c.zoneId)?.name ?? "" });
});

router.get("/coordinators/:id/stats", async (req, res): Promise<void> => {
  const params = GetCoordinatorStatsParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [coords, zones, allTrainers, allStudents, allModules, allProgress, allLocations] = await Promise.all([
    queryDocs<CoordinatorDoc>("coordinators", "numericId", "==", params.data.id),
    getDocs<ZoneDoc>("zones"),
    getDocs<TrainerDoc>("trainers"),
    getDocs<StudentDoc>("students"),
    getDocs<ModuleDoc>("modules"),
    getDocs<ProgressDoc>("progress"),
    getDocs<{ zoneId: number; numericId: number }>("locations"),
  ]);

  const c = coords[0];
  if (!c) { res.status(404).json({ error: "Coordinator not found" }); return; }

  const zoneId = c.zoneId;
  const zoneName = zones.find(z => z.numericId === zoneId)?.name ?? "";
  const centreCount = allLocations.filter(l => l.zoneId === zoneId).length;
  const zoneTrainers = allTrainers.filter(t => t.zoneId === zoneId);
  const trainerIds = zoneTrainers.map(t => t.numericId);
  const zoneStudents = allStudents.filter(s => s.trainerId && trainerIds.includes(s.trainerId));
  const studentCount = zoneStudents.length;
  const zoneStudentIds = zoneStudents.map(s => s.numericId);
  const totalSlots = studentCount * allModules.length;
  const completedCount = allProgress.filter(p => zoneStudentIds.includes(p.studentId) && p.rating === "independent").length;
  const completionRate = totalSlots > 0 ? Math.round((completedCount / totalSlots) * 100) : 0;

  res.json({ coordinatorId: c.numericId, name: c.name, zoneName, centreCount, trainerCount: zoneTrainers.length, studentCount, completionRate });
});

export default router;
