import "dotenv/config";
import express from "express";
import { parse as parseCookieHeader } from "cookie";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { getDashboard, getHealthRecord, saveDashboard, saveHealthRecord, listHealthcareRecords, insertHealthcareRecord, updateHealthcareRecord, deleteHealthcareRecord, type HealthRecord } from "../mongo";
import { authenticateRequest } from "./auth";
import { clearLocalSession, loginLocalAccount, registerLocalAccount } from "./localAuth";
import { randomUUID } from "node:crypto";
import { datasets, type DatasetKey, type HealthcareRecord } from "../../client/src/app/models/healthcare";
import { validateHealthcareValues } from "../healthcareValidation";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";
import { HttpError } from "@shared/_core/errors";

function sendAuthFailure(res: express.Response, error: unknown) {
  if (error instanceof HttpError) return res.status(error.statusCode).json({ error: error.message });
  console.error("[Auth] Session verification failed:", error);
  return res.status(503).json({ error: "Authentication service is unavailable" });
}

async function startServer() {
  const app = express();
  if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.post("/api/auth/local/signup", async (req, res) => {
    try {
      const session = await registerLocalAccount(req.body?.email, req.body?.name, req.body?.password);
      res.cookie(COOKIE_NAME, session.token, { ...getSessionCookieOptions(req), maxAge: session.maxAge });
      res.status(201).json({ user: { name: session.user.name, email: session.user.email } });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not create account";
      res.status(message.includes("Mongo") || message.includes("MONGODB") ? 503 : 400).json({ error: message });
    }
  });
  app.post("/api/auth/local/login", async (req, res) => {
    try {
      const session = await loginLocalAccount(req.body?.email, req.body?.password);
      res.cookie(COOKIE_NAME, session.token, { ...getSessionCookieOptions(req), maxAge: session.maxAge });
      res.json({ user: { name: session.user.name, email: session.user.email } });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not sign in";
      res.status(message.includes("Mongo") || message.includes("MONGODB") ? 503 : 401).json({ error: message });
    }
  });
  app.post("/api/auth/local/logout", async (req, res) => {
    const token = parseCookieHeader(req.headers.cookie ?? "")[COOKIE_NAME];
    await clearLocalSession(token);
    res.clearCookie(COOKIE_NAME, getSessionCookieOptions(req));
    res.json({ success: true });
  });
  app.get("/api/dashboard", async (req, res) => {
    let user;
    try {
      user = await authenticateRequest(req);
    } catch (error) { return sendAuthFailure(res, error); }
    try {
      res.json({ snapshot: await getDashboard(user.openId) });
    } catch (error) {
      console.error("[MongoDB] Dashboard read failed:", error);
      res.status(503).json({ error: "Dashboard storage is unavailable" });
    }
  });
  app.put("/api/dashboard", async (req, res) => {
    let user;
    try {
      user = await authenticateRequest(req);
    } catch (error) { return sendAuthFailure(res, error); }
    try {
      await saveDashboard(user.openId, req.body?.snapshot);
      res.json({ success: true });
    } catch (error) {
      console.error("[MongoDB] Dashboard save failed:", error);
      res.status(503).json({ error: "Dashboard storage is unavailable" });
    }
  });
  app.get("/api/health-record", async (req, res) => {
    let user;
    try {
      user = await authenticateRequest(req);
    } catch (error) { return sendAuthFailure(res, error); }
    try { res.json({ record: await getHealthRecord(user.openId) }); }
    catch { res.status(503).json({ error: "Health record storage is unavailable" }); }
  });
  app.put("/api/health-record", async (req, res) => {
    let user;
    try {
      user = await authenticateRequest(req);
    } catch (error) { return sendAuthFailure(res, error); }
    const value = req.body?.record as Partial<HealthRecord> | undefined;
      if (!value || ![value.sleepHours, value.moderateMinutes, value.vigorousMinutes, value.strengthDays].every(Number.isFinite)
        || value.sleepHours! < 0 || value.sleepHours! > 24 || value.moderateMinutes! < 0 || value.moderateMinutes! > 1000
        || value.vigorousMinutes! < 0 || value.vigorousMinutes! > 1000 || value.strengthDays! < 0 || value.strengthDays! > 7) {
        return res.status(400).json({ error: "Invalid health record" });
      }
      const record: HealthRecord = {
        sleepHours: value.sleepHours!, moderateMinutes: value.moderateMinutes!,
        vigorousMinutes: value.vigorousMinutes!, strengthDays: value.strengthDays!,
        recordedAt: new Date().toISOString(), source: "self_report",
        references: ["https://www.cdc.gov/sleep/about/", "https://www.who.int/initiatives/behealthy/physical-activity/"],
      };
    try { await saveHealthRecord(user.openId, record); res.json({ success: true }); }
    catch { res.status(503).json({ error: "Health record storage is unavailable" }); }
  });
  app.get("/api/healthcare-records", async (req, res) => {
    let user;
    try { user = await authenticateRequest(req); }
    catch (error) { return sendAuthFailure(res, error); }
    const dataset = typeof req.query.dataset === "string" ? req.query.dataset : undefined;
    if (dataset && !datasets.some((item) => item.key === dataset)) return res.status(400).json({ error: "Unknown dataset" });
    try {
      res.json({ records: await listHealthcareRecords(user.openId, dataset as DatasetKey | undefined) });
    } catch { res.status(503).json({ error: "Healthcare record storage is unavailable" }); }
  });
  app.post("/api/healthcare-records", async (req, res) => {
    let user;
    try { user = await authenticateRequest(req); }
    catch (error) { return sendAuthFailure(res, error); }
    const dataset = req.body?.dataset as DatasetKey;
    if (!datasets.some((item) => item.key === dataset) || !validateHealthcareValues(dataset, req.body?.values)) {
      return res.status(400).json({ error: "Enter valid values within the ranges shown for this dataset" });
    }
    const record: HealthcareRecord = { id: randomUUID(), dataset, values: req.body.values, recordedAt: new Date().toISOString(), source: "self_report" };
    try { await insertHealthcareRecord(user.openId, record); res.status(201).json({ record }); }
    catch { res.status(503).json({ error: "Healthcare record storage is unavailable" }); }
  });
  app.put("/api/healthcare-records/:id", async (req, res) => {
    let user;
    try { user = await authenticateRequest(req); }
    catch (error) { return sendAuthFailure(res, error); }
    const dataset = req.body?.dataset as DatasetKey;
    if (!datasets.some((item) => item.key === dataset) || !validateHealthcareValues(dataset, req.body?.values)) {
      return res.status(400).json({ error: "Enter valid values within the ranges shown for this dataset" });
    }
    try {
      const updated = await updateHealthcareRecord(user.openId, req.params.id, dataset, req.body.values);
      if (!updated) return res.status(404).json({ error: "Record not found" });
      res.json({ success: true });
    } catch { res.status(503).json({ error: "Healthcare record storage is unavailable" }); }
  });
  app.delete("/api/healthcare-records/:id", async (req, res) => {
    let user;
    try { user = await authenticateRequest(req); }
    catch (error) { return sendAuthFailure(res, error); }
    try {
      const deleted = await deleteHealthcareRecord(user.openId, req.params.id);
      if (!deleted) return res.status(404).json({ error: "Record not found" });
      res.json({ success: true });
    } catch { res.status(503).json({ error: "Healthcare record storage is unavailable" }); }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT || "3000");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
  server.on("error", error => { console.error("Server failed:", error.message); process.exit(1); });
  server.listen(port, "0.0.0.0", () => console.log(`Server listening on port ${port}`));
}

startServer().catch(error => { console.error(error); process.exit(1); });
