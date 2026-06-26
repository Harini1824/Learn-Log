import { addDoc, nextId } from "@workspace/firestore";

export interface AuditLogEntry {
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

export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const numericId = await nextId("auditLogs");
    await addDoc("auditLogs", {
      numericId,
      timestamp: new Date().toISOString(),
      ...entry,
    });
  } catch (_err) {
    // never throw — audit log failures must not break the main request
  }
}
