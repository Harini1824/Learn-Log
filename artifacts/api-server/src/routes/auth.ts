import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { queryDocs, addDoc, nextId, updateDoc } from "@workspace/firestore";
import {
  LoginBody,
  RegisterPinBody,
  CreateAccountBody,
  VerifyTempPinBody,
  SetPinBody,
  ResendPinBody,
} from "@workspace/api-zod";
import { sendTempPin } from "../lib/email";
import { writeAuditLog } from "../lib/audit-log";

interface UserDoc {
  numericId: number;
  phone: string;
  email?: string;
  pin?: string;
  pinHash?: string;
  role: string;
  entityId: number | null;
  name: string | null;
  status?: "pending" | "active";
  isFirstLogin?: boolean;
  tempPin?: string;
  tempPinExpiry?: number;
  tempPinVerified?: boolean;
}

function generatePin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { phone, email, pin } = parsed.data;

  if (!phone && !email) {
    res.status(400).json({ error: "Provide either email or phone number" });
    return;
  }

  let users: (UserDoc & { id: string })[] = [];
  if (email) {
    users = await queryDocs<UserDoc>("users", "email", "==", email.toLowerCase().trim());
  } else if (phone) {
    users = await queryDocs<UserDoc>("users", "phone", "==", phone);
  }

  const user = users[0];
  if (!user) {
    res.status(401).json({ error: "No account found for this identifier" });
    return;
  }

  if (user.status === "pending") {
    res.status(401).json({ error: "Account setup incomplete. Please verify your temporary PIN." });
    return;
  }

  let pinValid = false;
  if (user.pinHash) {
    pinValid = await bcrypt.compare(pin, user.pinHash);
  } else if (user.pin) {
    pinValid = user.pin === pin;
  }

  if (!pinValid) {
    writeAuditLog({
      userId: user.numericId,
      userName: user.name ?? (phone ?? email ?? null),
      role: user.role,
      action: "login_failed",
      entityType: "user",
      entityId: user.numericId,
      oldValue: null,
      newValue: null,
      ipAddress: (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.socket.remoteAddress ?? null,
    });
    res.status(401).json({ error: "Incorrect PIN" });
    return;
  }

  writeAuditLog({
    userId: user.numericId,
    userName: user.name ?? (phone ?? email ?? null),
    role: user.role,
    action: "login",
    entityType: "user",
    entityId: user.numericId,
    oldValue: null,
    newValue: null,
    ipAddress: (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.socket.remoteAddress ?? null,
  });

  res.json({
    success: true,
    role: user.role,
    userId: user.numericId,
    entityId: user.entityId ?? null,
    name: user.name ?? null,
  });
});

router.post("/auth/register-pin", async (req, res): Promise<void> => {
  const parsed = RegisterPinBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { phone, pin, role, entityId } = parsed.data;
  const existing = await queryDocs<UserDoc>("users", "phone", "==", phone);
  if (existing.length > 0) {
    res.status(400).json({ error: "An account already exists for this phone number" });
    return;
  }
  const numericId = await nextId("users");
  const data: UserDoc = { phone, pin, role, entityId: entityId ?? null, name: null, numericId, status: "active", isFirstLogin: false };
  const user = await addDoc("users", data);

  writeAuditLog({
    userId: user.numericId,
    userName: null,
    role: user.role,
    action: "user_created",
    entityType: "user",
    entityId: user.numericId,
    oldValue: null,
    newValue: JSON.stringify({ phone, role }),
    ipAddress: null,
  });

  res.status(201).json({
    success: true,
    role: user.role,
    userId: user.numericId,
    entityId: user.entityId ?? null,
    name: user.name ?? null,
  });
});

router.post("/auth/create-account", async (req, res): Promise<void> => {
  const parsed = CreateAccountBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, phone, role } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  if (!/^\d{10}$/.test(phone)) {
    res.status(400).json({ error: "Phone number must be exactly 10 digits" });
    return;
  }

  const existingByEmail = await queryDocs<UserDoc>("users", "email", "==", normalizedEmail);
  if (existingByEmail.length > 0) {
    res.status(400).json({ error: "An account already exists for this email address" });
    return;
  }

  const tempPin = generatePin();
  const tempPinExpiry = Date.now() + 10 * 60 * 1000;

  try {
    await sendTempPin(normalizedEmail, tempPin);
  } catch (err) {
    res.status(500).json({ error: "Failed to send email. Please check email configuration." });
    return;
  }

  const numericId = await nextId("users");
  const data: UserDoc = {
    numericId,
    email: normalizedEmail,
    phone,
    role,
    entityId: null,
    name: null,
    status: "pending",
    isFirstLogin: true,
    tempPin,
    tempPinExpiry,
    tempPinVerified: false,
  };
  await addDoc("users", data);

  writeAuditLog({
    userId: numericId,
    userName: null,
    role,
    action: "account_created",
    entityType: "user",
    entityId: numericId,
    oldValue: null,
    newValue: JSON.stringify({ email: normalizedEmail, phone, role }),
    ipAddress: (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.socket.remoteAddress ?? null,
  });

  res.status(201).json({ success: true, email: normalizedEmail });
});

router.post("/auth/verify-temp-pin", async (req, res): Promise<void> => {
  const parsed = VerifyTempPinBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, pin } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const users = await queryDocs<UserDoc>("users", "email", "==", normalizedEmail);
  const user = users[0];
  if (!user) {
    res.status(400).json({ error: "No account found for this email address" });
    return;
  }
  if (user.status !== "pending") {
    res.status(400).json({ error: "Account is already active. Please sign in." });
    return;
  }
  if (!user.tempPin || !user.tempPinExpiry) {
    res.status(400).json({ error: "No temporary PIN found. Please request a new one." });
    return;
  }
  if (Date.now() > user.tempPinExpiry) {
    res.status(400).json({ error: "Temporary PIN has expired. Please request a new one." });
    return;
  }
  if (user.tempPin !== pin) {
    res.status(400).json({ error: "Incorrect temporary PIN" });
    return;
  }

  await updateDoc("users", user.id, { tempPinVerified: true });

  res.json({ success: true, email: normalizedEmail });
});

router.post("/auth/set-pin", async (req, res): Promise<void> => {
  const parsed = SetPinBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, newPin, confirmPin } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  if (!/^\d{4}$/.test(newPin)) {
    res.status(400).json({ error: "PIN must be exactly 4 digits" });
    return;
  }
  if (newPin !== confirmPin) {
    res.status(400).json({ error: "PINs do not match" });
    return;
  }

  const users = await queryDocs<UserDoc>("users", "email", "==", normalizedEmail);
  const user = users[0];
  if (!user) {
    res.status(400).json({ error: "No account found for this email address" });
    return;
  }
  if (!user.tempPinVerified) {
    res.status(400).json({ error: "Please verify your temporary PIN first" });
    return;
  }

  const pinHash = await bcrypt.hash(newPin, 10);

  await updateDoc("users", user.id, {
    pinHash,
    isFirstLogin: false,
    status: "active",
    tempPin: null,
    tempPinExpiry: null,
    tempPinVerified: null,
  });

  writeAuditLog({
    userId: user.numericId,
    userName: null,
    role: user.role,
    action: "pin_set",
    entityType: "user",
    entityId: user.numericId,
    oldValue: null,
    newValue: JSON.stringify({ status: "active" }),
    ipAddress: (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.socket.remoteAddress ?? null,
  });

  res.json({
    success: true,
    role: user.role,
    userId: user.numericId,
    entityId: user.entityId ?? null,
    name: user.name ?? null,
  });
});

router.post("/auth/resend-pin", async (req, res): Promise<void> => {
  const parsed = ResendPinBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const users = await queryDocs<UserDoc>("users", "email", "==", normalizedEmail);
  const user = users[0];
  if (!user) {
    res.status(400).json({ error: "No account found for this email address" });
    return;
  }
  if (user.status !== "pending") {
    res.status(400).json({ error: "Account is already active. Please sign in." });
    return;
  }

  const tempPin = generatePin();
  const tempPinExpiry = Date.now() + 10 * 60 * 1000;

  try {
    await sendTempPin(normalizedEmail, tempPin);
  } catch {
    res.status(500).json({ error: "Failed to send email. Please check email configuration." });
    return;
  }

  await updateDoc("users", user.id, { tempPin, tempPinExpiry, tempPinVerified: false });

  res.json({ success: true });
});

export default router;
