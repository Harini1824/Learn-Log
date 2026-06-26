import { Router, type IRouter } from "express";
import { getDocs, addDoc, nextId, queryDocs } from "@workspace/firestore";
import { CreateLocationBody, ListLocationsQueryParams } from "@workspace/api-zod";

interface LocationDoc { centreName: string; zoneId: number; coordinatorId: number | null; numericId: number; }
interface ZoneDoc { name: string; numericId: number; }
interface CoordinatorDoc { name: string; numericId: number; }

const router: IRouter = Router();

router.get("/locations", async (req, res): Promise<void> => {
  const query = ListLocationsQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }

  const [allLocs, allZones, allCoords] = await Promise.all([
    getDocs<LocationDoc>("locations"),
    getDocs<ZoneDoc>("zones"),
    getDocs<CoordinatorDoc>("coordinators"),
  ]);

  let locs = allLocs;
  if (query.data.zoneId) locs = locs.filter(l => l.zoneId === query.data.zoneId);
  locs.sort((a, b) => a.centreName.localeCompare(b.centreName));

  res.json(locs.map(l => ({
    id: l.numericId,
    centreName: l.centreName,
    zoneId: l.zoneId,
    zoneName: allZones.find(z => z.numericId === l.zoneId)?.name ?? "",
    coordinatorId: l.coordinatorId ?? null,
    coordinatorName: l.coordinatorId ? (allCoords.find(c => c.numericId === l.coordinatorId)?.name ?? null) : null,
  })));
});

router.post("/locations", async (req, res): Promise<void> => {
  const parsed = CreateLocationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const numericId = await nextId("locations");
  const data: LocationDoc = { centreName: parsed.data.centreName, zoneId: parsed.data.zoneId, coordinatorId: parsed.data.coordinatorId ?? null, numericId };
  const loc = await addDoc("locations", data);
  const [zones, coords] = await Promise.all([
    queryDocs<ZoneDoc>("zones", "numericId", "==", loc.zoneId),
    loc.coordinatorId ? queryDocs<CoordinatorDoc>("coordinators", "numericId", "==", loc.coordinatorId) : Promise.resolve([]),
  ]);
  res.status(201).json({
    id: loc.numericId,
    centreName: loc.centreName,
    zoneId: loc.zoneId,
    zoneName: zones[0]?.name ?? "",
    coordinatorId: loc.coordinatorId ?? null,
    coordinatorName: coords[0]?.name ?? null,
  });
});

export default router;
