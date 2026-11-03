import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { UnauthorizedError } from "@shared/_core/errors";
import { COOKIE_NAME } from "@shared/const";
import type { User } from "../../drizzle/schema";
import { getLocalSession } from "./localAuth";

export type AuthenticatedUser = User;

export async function authenticateRequest(req: Request): Promise<AuthenticatedUser> {
  const cookies = parseCookieHeader(req.headers.cookie ?? "");
  const user = await getLocalSession(cookies[COOKIE_NAME]);
  if (!user) throw UnauthorizedError("Sign in required");
  return user;
}
