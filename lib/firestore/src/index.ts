import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function initFirebase() {
  if (getApps().length > 0) return;

  const raw = process.env["FIREBASE_SERVICE_ACCOUNT"];
  if (!raw) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is required but was not provided.");
  }

  let serviceAccount: object;
  try {
    serviceAccount = JSON.parse(raw);
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT is not valid JSON.");
  }

  initializeApp({ credential: cert(serviceAccount as any) });
}

initFirebase();

export const db = getFirestore();

// ─── Collection helpers ──────────────────────────────────────────────────────

export async function getDoc<T>(col: string, id: string): Promise<(T & { id: string }) | null> {
  const snap = await db.collection(col).doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as T) };
}

export async function getDocs<T>(col: string): Promise<(T & { id: string })[]> {
  const snap = await db.collection(col).get();
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as T) }));
}

export async function queryDocs<T>(
  col: string,
  field: string,
  op: FirebaseFirestore.WhereFilterOp,
  value: unknown,
): Promise<(T & { id: string })[]> {
  const snap = await db.collection(col).where(field, op, value).get();
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as T) }));
}

export async function addDoc<T extends object>(col: string, data: T): Promise<T & { id: string }> {
  const ref = await db.collection(col).add(data);
  return { id: ref.id, ...data };
}

export async function setDoc<T extends object>(col: string, id: string, data: T): Promise<T & { id: string }> {
  await db.collection(col).doc(id).set(data);
  return { id, ...data };
}

export async function updateDoc(col: string, id: string, data: object): Promise<void> {
  await db.collection(col).doc(id).update(data as FirebaseFirestore.UpdateData<object>);
}

// ─── Numeric ID helpers (mirror the old serial PK pattern) ───────────────────
// Each collection stores a metadata doc `_seq` with a `next` counter.

export async function nextId(col: string): Promise<number> {
  const ref = db.collection("_sequences").doc(col);
  const result = await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    const current: number = snap.exists ? (snap.data()!["next"] as number) : 1;
    tx.set(ref, { next: current + 1 });
    return current;
  });
  return result;
}
