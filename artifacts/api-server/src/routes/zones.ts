import { Router, type IRouter } from "express";
import { getDocs, getDoc, addDoc, nextId, queryDocs } from "@workspace/firestore";
import { CreateZoneBody, GetZoneParams } from "@workspace/api-zod";

interface ZoneDoc {
  name: string;
  description: string;
  numericId: number;
}

const router: IRouter = Router();

router.get("/zones", async (_req, res): Promise<void> => {
  const zones = await getDocs<ZoneDoc>("zones");
  const sorted = zones.sort((a, b) => a.name.localeCompare(b.name));
  res.json(sorted.map(z => ({ id: z.numericId, name: z.name, description: z.description })));
});

router.post("/zones", async (req, res): Promise<void> => {
  const parsed = CreateZoneBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const numericId = await nextId("zones");
  const zone = await addDoc<ZoneDoc>("zones", { name: parsed.data.name, description: parsed.data.description ?? "", numericId });
  res.status(201).json({ id: zone.numericId, name: zone.name, description: zone.description });
});

router.get("/zones/:id", async (req, res): Promise<void> => {
  const params = GetZoneParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const zones = await queryDocs<ZoneDoc>("zones", "numericId", "==", params.data.id);
  const zone = zones[0];
  if (!zone) {
    res.status(404).json({ error: "Zone not found" });
    return;
  }
  res.json({ id: zone.numericId, name: zone.name, description: zone.description });
});

export default router;
