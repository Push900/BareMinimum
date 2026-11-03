import "dotenv/config";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { MongoClient } from "mongodb";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";

if (!process.env.MONGODB_URI) throw new Error("Set MONGODB_URI before running this verification.");

const root = fileURLToPath(new URL("../", import.meta.url));
const port = Number(process.env.PORT || 3001);
const baseUrl = `http://127.0.0.1:${port}`;
const suffix = randomUUID();
const accounts = [
  { email: `bareminimum-flow-a-${suffix}@example.invalid`, name: "Flow Test A", password: `Flow-${suffix}-Aa1!` },
  { email: `bareminimum-flow-b-${suffix}@example.invalid`, name: "Flow Test B", password: `Flow-${suffix}-Bb2!` },
];
let server;
let accountIds = [];
let mongo;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function startServer() {
  return spawn(process.execPath, [path.join(root, "tools/run-server.mjs"), "dev"], {
    cwd: root,
    env: { ...process.env, PORT: String(port), NODE_ENV: "development" },
    stdio: "inherit",
  });
}

async function stopServer(child) {
  if (!child || child.exitCode !== null) return;
  child.kill("SIGTERM");
  await Promise.race([once(child, "exit"), new Promise(resolve => setTimeout(resolve, 5000))]);
}

async function waitForServer(child) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Development server exited with code ${child.exitCode}`);
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch { /* Server is still starting. */ }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error("Development server did not become ready within 30 seconds.");
}

async function request(route, { cookie, ...options } = {}) {
  const headers = new Headers(options.headers);
  if (cookie) headers.set("cookie", cookie);
  return fetch(`${baseUrl}${route}`, { ...options, headers });
}

function readCookie(response) {
  const value = response.headers.get("set-cookie")?.split(";")[0];
  assert(value, "The authentication response did not set a session cookie.");
  return value;
}

async function signUp(account) {
  const response = await request("/api/auth/local/signup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(account),
  });
  assert(response.status === 201, `Account creation failed with HTTP ${response.status}: ${await response.text()}`);
  return readCookie(response);
}

function trpcClient(cookie) {
  return createTRPCProxyClient({
    links: [httpBatchLink({
      url: `${baseUrl}/api/trpc`,
      transformer: superjson,
      fetch(input, init) {
        const headers = new Headers(init?.headers);
        headers.set("cookie", cookie);
        return fetch(input, { ...init, headers });
      },
    })],
  });
}

async function cleanTestData() {
  if (!mongo) return;
  const db = mongo.db(process.env.MONGODB_DB_NAME || "bareminimum");
  for (const email of accounts.map(account => account.email)) {
    const account = await db.collection("localAccounts").findOne({ _id: email });
    if (!account) continue;
    accountIds.push(account.openId);
  }
  for (const openId of accountIds) {
    await Promise.all([
      db.collection("authSessions").deleteMany({ openId }),
      db.collection("dashboardSnapshots").deleteOne({ _id: openId }),
      db.collection("healthRecords").deleteOne({ _id: openId }),
      db.collection("healthcareRecords").deleteMany({ userId: openId }),
    ]);
  }
  await db.collection("localAccounts").deleteMany({ _id: { $in: accounts.map(account => account.email) } });
}

let createdRecordId;
try {
  mongo = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  await mongo.connect();
  server = startServer();
  await waitForServer(server);

  for (const route of ["/api/dashboard", "/api/health-record", "/api/healthcare-records"]) {
    const response = await request(route);
    assert(response.status === 401, `Unauthenticated ${route} returned HTTP ${response.status}, expected 401.`);
  }

  let cookieA = await signUp(accounts[0]);
  const emptyDashboard = await request("/api/dashboard", { cookie: cookieA });
  assert(emptyDashboard.ok && (await emptyDashboard.json()).snapshot === null, "New accounts should start without a saved dashboard snapshot.");

  const baselineResponse = await request("/api/health-record", {
    cookie: cookieA,
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ record: { sleepHours: 7, moderateMinutes: 150, vigorousMinutes: 0, strengthDays: 2 } }),
  });
  assert(baselineResponse.ok, `Wellness save failed with HTTP ${baselineResponse.status}.`);
  const baselineRead = await request("/api/health-record", { cookie: cookieA });
  assert((await baselineRead.json()).record?.sleepHours === 7, "The wellness baseline did not persist.");

  const taskResponse = await request("/api/healthcare-records", {
    cookie: cookieA,
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ dataset: "timetable", values: { task: "Flow test task", category: "wellbeing", scheduledAt: "2026-11-03", durationMinutes: 20, completed: false } }),
  });
  assert(taskResponse.status === 201, `Timetable task creation failed with HTTP ${taskResponse.status}: ${await taskResponse.text()}`);
  const created = await taskResponse.json();
  createdRecordId = created.record.id;

  const validSnapshot = {
    profile: { name: accounts[0].name, screenReaderEnabled: true, quietMode: false },
    metrics: [], activities: [],
    summary: { impactScore: 0, impactDelta: "0", streak: 0, deepWork: "0", deepWorkDelta: "0", carbonSaved: "0", carbonDelta: "0" },
  };
  const dashboardSave = await request("/api/dashboard", { cookie: cookieA, method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ snapshot: validSnapshot }) });
  assert(dashboardSave.ok, `Dashboard save failed with HTTP ${dashboardSave.status}.`);

  const history = await request("/api/healthcare-records", { cookie: cookieA });
  assert((await history.json()).records.some(record => record.id === createdRecordId), "The saved task was not returned in account history.");

  await stopServer(server);
  server = startServer();
  await waitForServer(server);
  const afterRestart = await request("/api/healthcare-records", { cookie: cookieA });
  assert((await afterRestart.json()).records.some(record => record.id === createdRecordId), "The session or record did not persist across a server restart.");
  const dashboardAfterRestart = await request("/api/dashboard", { cookie: cookieA });
  assert((await dashboardAfterRestart.json()).snapshot?.profile?.name === accounts[0].name, "The dashboard snapshot did not persist across a server restart.");

  const trpcA = trpcClient(cookieA);
  const loggedOut = await trpcA.auth.logout.mutate();
  assert(loggedOut.success, "The profile logout mutation did not report success.");
  const afterLogout = await request("/api/healthcare-records", { cookie: cookieA });
  assert(afterLogout.status === 401, "The revoked session still accessed protected data.");

  const login = await request("/api/auth/local/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: accounts[0].email, password: accounts[0].password }),
  });
  assert(login.ok, `Sign-in failed with HTTP ${login.status}.`);
  cookieA = readCookie(login);

  const cookieB = await signUp(accounts[1]);
  const historyB = await request("/api/healthcare-records", { cookie: cookieB });
  assert((await historyB.json()).records.length === 0, "Account B could read Account A's records.");
  const baselineB = await request("/api/health-record", { cookie: cookieB });
  assert((await baselineB.json()).record === null, "Account B could read Account A's wellness baseline.");
  const dashboardB = await request("/api/dashboard", { cookie: cookieB });
  assert((await dashboardB.json()).snapshot === null, "Account B could read Account A's dashboard snapshot.");

  const crossUserUpdate = await request(`/api/healthcare-records/${createdRecordId}`, {
    cookie: cookieB,
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ dataset: "timetable", values: { task: "Unauthorized edit", scheduledAt: "2026-11-03", completed: true } }),
  });
  assert(crossUserUpdate.status === 404, `Cross-account update returned HTTP ${crossUserUpdate.status}, expected 404.`);
  const crossUserDelete = await request(`/api/healthcare-records/${createdRecordId}`, { cookie: cookieB, method: "DELETE" });
  assert(crossUserDelete.status === 404, `Cross-account delete returned HTTP ${crossUserDelete.status}, expected 404.`);

  console.log("Auth flow passed: sign-up, sign-in, MongoDB reads/writes, server-restart session persistence, logout, 401 protection, timetable persistence, and two-account isolation.");
} finally {
  await stopServer(server);
  await cleanTestData();
  if (mongo) await mongo.close();
}
