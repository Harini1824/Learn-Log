import { Router, type IRouter } from "express";
import { getDocs, queryDocs } from "@workspace/firestore";

interface StudentDoc { name: string; trainerId: number | null; numericId: number; }
interface TrainerDoc { name: string; zoneId: number; numericId: number; }
interface CoordinatorDoc { name: string; zoneId: number; numericId: number; }
interface ZoneDoc { name: string; numericId: number; }
interface LocationDoc { zoneId: number; numericId: number; }
interface ProgressDoc { studentId: number; moduleId: number; trainerId: number | null; rating: string; comments?: string | null; submittedAt: string; updatedAt?: string; numericId: number; }
interface ModuleDoc { chapterId: number; numericId: number; name: string; }
interface ChapterDoc { unitId: number; numericId: number; name: string; }
interface UnitDoc { numericId: number; name: string; }
interface AuditLogDoc { numericId: number; timestamp: string; userId: number | null; userName: string | null; role: string | null; action: string; entityType: string; entityId: number | null; oldValue: string | null; newValue: string | null; ipAddress: string | null; }

const router: IRouter = Router();

const RATING_LABELS = ["totally_dependent", "physical_prompting", "verbal_prompting", "clueing", "independent"];

function todayPrefix() {
  return new Date().toISOString().slice(0, 10);
}

router.get("/dashboard/management", async (_req, res): Promise<void> => {
  const [students, trainers, coordinators, zones, locations, allProgress, allModules, allChapters, allUnits, allStudents, allTrainers, auditLogs] = await Promise.all([
    getDocs<StudentDoc>("students"),
    getDocs<TrainerDoc>("trainers"),
    getDocs<CoordinatorDoc>("coordinators"),
    getDocs<ZoneDoc>("zones"),
    getDocs<LocationDoc>("locations"),
    getDocs<ProgressDoc>("progress"),
    getDocs<ModuleDoc>("modules"),
    getDocs<ChapterDoc>("chapters"),
    getDocs<UnitDoc>("units"),
    getDocs<StudentDoc>("students"),
    getDocs<TrainerDoc>("trainers"),
    getDocs<AuditLogDoc>("auditLogs"),
  ]);

  const totalStudents = students.length;
  const totalModuleSlots = totalStudents * allModules.length;
  const completedSlots = allProgress.filter(p => p.rating === "independent").length;
  const overallCompletionRate = totalModuleSlots > 0 ? Math.round((completedSlots / totalModuleSlots) * 100) : 0;
  const ratingDistribution = RATING_LABELS.map(r => ({ rating: r, count: allProgress.filter(p => p.rating === r).length }));

  const today = todayPrefix();
  const totalRatings = allProgress.length;
  const ratingsToday = allProgress.filter(p => (p.updatedAt ?? p.submittedAt).startsWith(today)).length;
  const pendingModules = Math.max(0, totalModuleSlots - allProgress.length);

  const recentRows = [...allProgress]
    .sort((a, b) => (b.updatedAt ?? b.submittedAt).localeCompare(a.updatedAt ?? a.submittedAt))
    .slice(0, 5);

  const recentlyUpdated = recentRows.map(p => {
    const s = allStudents.find(st => st.numericId === p.studentId);
    const trainer = p.trainerId ? allTrainers.find(t => t.numericId === p.trainerId) : undefined;
    const mod = allModules.find(m => m.numericId === p.moduleId);
    const ch = mod ? allChapters.find(c => c.numericId === mod.chapterId) : undefined;
    const unit = ch ? allUnits.find(u => u.numericId === ch.unitId) : undefined;
    return {
      id: p.numericId,
      studentId: p.studentId,
      studentName: s?.name ?? "",
      trainerId: p.trainerId ?? null,
      trainerName: trainer?.name ?? null,
      moduleId: p.moduleId,
      moduleName: mod?.name ?? "",
      chapterName: ch?.name ?? "",
      unitName: unit?.name ?? "",
      rating: p.rating,
      comments: p.comments ?? null,
      submittedAt: p.submittedAt,
      updatedAt: p.updatedAt ?? null,
    };
  });

  const recentAuditLogs = [...auditLogs]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 5)
    .map(l => ({
      id: l.numericId,
      timestamp: l.timestamp,
      userId: l.userId ?? null,
      userName: l.userName ?? null,
      role: l.role ?? null,
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId ?? null,
      oldValue: l.oldValue ?? null,
      newValue: l.newValue ?? null,
      ipAddress: l.ipAddress ?? null,
    }));

  res.json({
    totalStudents,
    totalTrainers: trainers.length,
    totalCoordinators: coordinators.length,
    totalZones: zones.length,
    totalLocations: locations.length,
    overallCompletionRate,
    ratingDistribution,
    totalRatings,
    ratingsToday,
    pendingModules,
    recentlyUpdated,
    recentAuditLogs,
  });
});

router.get("/dashboard/trainer/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid trainer id" }); return; }

  const [allTrainers, allZones, allStudents, allModules, allProgress, allChapters, allUnits] = await Promise.all([
    getDocs<TrainerDoc>("trainers"),
    getDocs<ZoneDoc>("zones"),
    getDocs<StudentDoc>("students"),
    getDocs<ModuleDoc>("modules"),
    getDocs<ProgressDoc>("progress"),
    getDocs<ChapterDoc>("chapters"),
    getDocs<UnitDoc>("units"),
  ]);

  const trainer = allTrainers.find(t => t.numericId === id);
  if (!trainer) { res.status(404).json({ error: "Trainer not found" }); return; }

  const zone = allZones.find(z => z.numericId === trainer.zoneId);
  const students = allStudents.filter(s => s.trainerId === id);
  const studentIds = students.map(s => s.numericId);
  const trainerProgress = allProgress.filter(p => studentIds.includes(p.studentId));

  const totalSlots = students.length * allModules.length;
  const completedSlots = trainerProgress.filter(p => p.rating === "independent").length;
  const completionRate = totalSlots > 0 ? Math.round((completedSlots / totalSlots) * 100) : 0;
  const ratingDistribution = RATING_LABELS.map(r => ({ rating: r, count: trainerProgress.filter(p => p.rating === r).length }));

  const recentRows = [...trainerProgress].sort((a, b) => (b.updatedAt ?? b.submittedAt).localeCompare(a.updatedAt ?? a.submittedAt)).slice(0, 10);
  const recentActivity = recentRows.map(p => {
    const s = allStudents.find(st => st.numericId === p.studentId);
    const mod = allModules.find(m => m.numericId === p.moduleId);
    const ch = mod ? allChapters.find(c => c.numericId === mod.chapterId) : undefined;
    const unit = ch ? allUnits.find(u => u.numericId === ch.unitId) : undefined;
    return { id: p.numericId, studentId: p.studentId, studentName: s?.name ?? "", trainerId: p.trainerId ?? null, trainerName: trainer.name, moduleId: p.moduleId, moduleName: mod?.name ?? "", chapterName: ch?.name ?? "", unitName: unit?.name ?? "", rating: p.rating, comments: p.comments ?? null, submittedAt: p.submittedAt, updatedAt: p.updatedAt ?? null };
  });

  res.json({ trainerId: trainer.numericId, trainerName: trainer.name, zoneName: zone?.name ?? "", studentCount: students.length, completionRate, ratingDistribution, recentActivity });
});

router.get("/dashboard/coordinator/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid coordinator id" }); return; }

  const [allCoords, allZones, allTrainers, allStudents, allModules, allProgress, allLocations] = await Promise.all([
    getDocs<CoordinatorDoc>("coordinators"),
    getDocs<ZoneDoc>("zones"),
    getDocs<TrainerDoc>("trainers"),
    getDocs<StudentDoc>("students"),
    getDocs<ModuleDoc>("modules"),
    getDocs<ProgressDoc>("progress"),
    getDocs<LocationDoc>("locations"),
  ]);

  const coord = allCoords.find(c => c.numericId === id);
  if (!coord) { res.status(404).json({ error: "Coordinator not found" }); return; }

  const zoneId = coord.zoneId;
  const zone = allZones.find(z => z.numericId === zoneId);
  const zoneTrainers = allTrainers.filter(t => t.zoneId === zoneId);
  const trainerIds = zoneTrainers.map(t => t.numericId);
  const zoneStudents = allStudents.filter(s => s.trainerId && trainerIds.includes(s.trainerId));
  const studentIds = zoneStudents.map(s => s.numericId);
  const zoneProgress = allProgress.filter(p => studentIds.includes(p.studentId));
  const totalSlots = zoneStudents.length * allModules.length;
  const completedSlots = zoneProgress.filter(p => p.rating === "independent").length;
  const completionRate = totalSlots > 0 ? Math.round((completedSlots / totalSlots) * 100) : 0;
  const centreCount = allLocations.filter(l => l.zoneId === zoneId).length;

  const trainerPerformance = zoneTrainers.map(t => {
    const tStudents = zoneStudents.filter(s => s.trainerId === t.numericId);
    const tSlots = tStudents.length * allModules.length;
    const tDone = zoneProgress.filter(p => tStudents.map(s => s.numericId).includes(p.studentId) && p.rating === "independent").length;
    return { trainerId: t.numericId, name: t.name, studentCount: tStudents.length, completionRate: tSlots > 0 ? Math.round((tDone / tSlots) * 100) : 0 };
  });

  res.json({ coordinatorId: coord.numericId, coordinatorName: coord.name, zoneName: zone?.name ?? "", centreCount, trainerCount: zoneTrainers.length, studentCount: zoneStudents.length, completionRate, trainerPerformance });
});

export default router;
