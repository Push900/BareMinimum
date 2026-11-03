import type { CookieOptions, Request } from "express";

export function getSessionCookieOptions(_req: Request): CookieOptions {
  return { httpOnly: true, path: "/", sameSite: "lax", secure: _req.secure || process.env.NODE_ENV === "production" };
}
