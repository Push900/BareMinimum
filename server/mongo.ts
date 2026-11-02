import { MongoClient, type Db } from "mongodb";
import type { DashboardSnapshot } from "../client/src/app/models/dashboard";

const uri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB_NAME || "bareminimum";
let client: MongoClient | undefined;
let database: Db | undefined;
type DashboardDocument = { _id: string; snapshot: DashboardSnapshot; updatedAt: Date };

async function getDatabase() {
  if (!uri) throw new Error("MONGODB_URI is not configured");
  if (!database) {
    client ??= new MongoClient(uri, { serverSelectionTimeoutMS: 2500 });
    await client.connect();
    database = client.db(databaseName);
  }
  return database;
}

function isSnapshot(value: unknown): value is DashboardSnapshot {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<DashboardSnapshot>;
  return Boolean(
    data.profile && Array.isArray(data.metrics) && Array.isArray(data.activities) &&
    data.summary && typeof data.summary.impactScore === "number",
  );
}

export async function getDashboard(): Promise<DashboardSnapshot | null> {
  const db = await getDatabase();
  const document = await db.collection<DashboardDocument>("dashboardSnapshots")
    .findOne({ _id: "default" });
  return document?.snapshot ?? null;
}

export async function saveDashboard(snapshot: unknown): Promise<void> {
  if (!isSnapshot(snapshot)) throw new Error("Invalid dashboard snapshot");
  const db = await getDatabase();
  await db.collection<DashboardDocument>("dashboardSnapshots").updateOne(
    { _id: "default" },
    { $set: { snapshot, updatedAt: new Date() } },
    { upsert: true },
  );
}
