import { Router, type IRouter } from "express";
import { getDocs } from "@workspace/firestore";
import { ListAuditLogsQueryParams } from "@workspace/api-zod";

interface AuditLogDoc {
  numericId: number;
  timestamp: string;
  userId: number | null;
  userName: string | null;
  role: string | null;
  action: string;
  entityType: string;
  entityId: number | null;
  oldValue: string | null;
  newValue: string | null;
  ipAddress: string | null;
}

const router: IRouter = Router();

router.get("/audit-logs", async (req, res): Promise<void> => {
  const query = ListAuditLogsQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }

  const { search, dateFrom, dateTo, userId, action, entityType, page = 1, pageSize = 20 } = query.data;

  const allLogs = await getDocs<AuditLogDoc>("auditLogs");
  let logs = allLogs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  if (search) {
    const q = search.toLowerCase();
    logs = logs.filter(l =>
      (l.userName ?? "").toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      l.entityType.toLowerCase().includes(q)
    );
  }
  if (dateFrom) logs = logs.filter(l => l.timestamp >= dateFrom);
  if (dateTo) {
    const end = dateTo.length === 10 ? dateTo + "T23:59:59.999Z" : dateTo;
    logs = logs.filter(l => l.timestamp <= end);
  }
  if (userId) logs = logs.filter(l => l.userId === userId);
  if (action) logs = logs.filter(l => l.action === action);
  if (entityType) logs = logs.filter(l => l.entityType === entityType);

  const total = logs.length;
  const safePageSize = Math.min(Math.max(pageSize, 1), 100);
  const safePage = Math.max(page, 1);
  const items = logs.slice((safePage - 1) * safePageSize, safePage * safePageSize).map(l => ({
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

  res.json({ items, total, page: safePage, pageSize: safePageSize });
});

export default router;
