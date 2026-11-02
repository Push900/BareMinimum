import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { User } from "../../drizzle/schema";
import { createLocalAccount, getLocalAccount } from "../mongo";

const SESSION_LIFETIME_MS = 24 * 60 * 60 * 1000;
const sessions = new Map<string, { user: User; expiresAt: number }>();

function passwordHash(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString("hex");
}

export async function registerLocalAccount(emailInput: unknown, nameInput: unknown, passwordInput: unknown) {
  if (process.env.NODE_ENV !== "development") throw new Error("Local accounts are only available in development");
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
  if (process.env.NODE_ENV !== "development") throw new Error("Local accounts are only available in development");
  const email = typeof emailInput === "string" ? emailInput.trim().toLowerCase() : "";
  const password = typeof passwordInput === "string" ? passwordInput : "";
  const account = await getLocalAccount(email);
  const candidate = account ? Buffer.from(passwordHash(password, account.salt), "hex") : Buffer.alloc(64);
  const expected = account ? Buffer.from(account.passwordHash, "hex") : Buffer.alloc(64);
  if (!account || candidate.length !== expected.length || !timingSafeEqual(candidate, expected)) throw new Error("Email or password is incorrect");
  return createSession(account.openId, account.name, email);
}

function createSession(openId: string, name: string, email: string) {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const user: User = { id: -Math.floor(Math.random() * 1_000_000) - 1, openId, name, email, loginMethod: "local-development", role: "user", createdAt: now, updatedAt: now, lastSignedIn: now };
  sessions.set(token, { user, expiresAt: Date.now() + SESSION_LIFETIME_MS });
  return { token, user, maxAge: SESSION_LIFETIME_MS };
}

export function getLocalSession(token?: string): User | null {
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) { sessions.delete(token); return null; }
  return session.user;
}

export function clearLocalSession(token?: string) { if (token) sessions.delete(token); }
