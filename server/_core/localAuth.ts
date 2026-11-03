import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { User } from "../../drizzle/schema";
import { createLocalAccount, createLocalSession as persistSession, deleteLocalSession, getLocalAccount, getLocalAccountByOpenId, getLocalSessionByTokenHash } from "../mongo";

const SESSION_LIFETIME_MS = 24 * 60 * 60 * 1000;
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

function passwordHash(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString("hex");
}

export async function registerLocalAccount(emailInput: unknown, nameInput: unknown, passwordInput: unknown) {
  const email = typeof emailInput === "string" ? emailInput.trim().toLowerCase() : "";
  const name = typeof nameInput === "string" ? nameInput.trim().slice(0, 80) : "";
  const password = typeof passwordInput === "string" ? passwordInput : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) throw new Error("Enter a valid email address");
  if (!name) throw new Error("Enter your name");
  if (password.length < 8 || password.length > 256) throw new Error("Password must be 8 to 256 characters");
  if (await getLocalAccount(email)) throw new Error("An account with that email already exists. Sign in instead.");

  const salt = randomBytes(16).toString("hex");
  const openId = `local_${randomBytes(20).toString("hex")}`;
  await createLocalAccount({ _id: email, openId, name, salt, passwordHash: passwordHash(password, salt), createdAt: new Date() });
  return createSession(openId, name, email);
}

export async function loginLocalAccount(emailInput: unknown, passwordInput: unknown) {
  const email = typeof emailInput === "string" ? emailInput.trim().toLowerCase() : "";
  const password = typeof passwordInput === "string" ? passwordInput : "";
  const account = await getLocalAccount(email);
  const candidate = account ? Buffer.from(passwordHash(password, account.salt), "hex") : Buffer.alloc(64);
  const expected = account ? Buffer.from(account.passwordHash, "hex") : Buffer.alloc(64);
  if (!account || candidate.length !== expected.length || !timingSafeEqual(candidate, expected)) throw new Error("Email or password is incorrect");
  return createSession(account.openId, account.name, email);
}

async function createSession(openId: string, name: string, email: string) {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const user: User = { id: -Math.floor(Math.random() * 1_000_000) - 1, openId, name, email, loginMethod: "local-development", role: "user", createdAt: now, updatedAt: now, lastSignedIn: now };
  await persistSession({ _id: hashToken(token), openId, expiresAt: new Date(Date.now() + SESSION_LIFETIME_MS) });
  return { token, user, maxAge: SESSION_LIFETIME_MS };
}

export async function getLocalSession(token?: string): Promise<User | null> {
  if (!token) return null;
  const session = await getLocalSessionByTokenHash(hashToken(token));
  if (!session) return null;
  const account = await getLocalAccountByOpenId(session.openId);
  if (!account) return null;
  const now = new Date();
  return { id: -1, openId: account.openId, email: account._id, name: account.name, loginMethod: "local-development", role: "user", createdAt: account.createdAt, updatedAt: account.createdAt, lastSignedIn: now };
}

export async function clearLocalSession(token?: string) { if (token) await deleteLocalSession(hashToken(token)); }
