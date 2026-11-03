import { MongoClient, type Db } from "mongodb";
import type { DashboardSnapshot } from "../client/src/app/models/dashboard";
import type { DatasetKey, HealthcareRecord } from "../client/src/app/models/healthcare";

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
    await database.collection<LocalSession>("authSessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await database.collection<LocalAccount>("localAccounts").createIndex({ openId: 1 }, { unique: true });
  }
  return database;
}

export type LocalAccount = { _id: string; openId: string; name: string; salt: string; passwordHash: string; createdAt: Date };
export type LocalSession = { _id: string; openId: string; expiresAt: Date };

export async function getLocalAccount(email: string): Promise<LocalAccount | null> {
  const db = await getDatabase();
  return db.collection<LocalAccount>("localAccounts").findOne({ _id: email });
}

export async function createLocalAccount(account: LocalAccount): Promise<void> {
  const db = await getDatabase();
  await db.collection<LocalAccount>("localAccounts").insertOne(account);
}

export async function createLocalSession(session: LocalSession): Promise<void> {
  const db = await getDatabase();
  await db.collection<LocalSession>("authSessions").insertOne(session);
}

export async function getLocalSessionByTokenHash(tokenHash: string): Promise<LocalSession | null> {
  const db = await getDatabase();
  return db.collection<LocalSession>("authSessions").findOne({ _id: tokenHash, expiresAt: { $gt: new Date() } });
}

export async function deleteLocalSession(tokenHash: string): Promise<void> {
  const db = await getDatabase();
  await db.collection<LocalSession>("authSessions").deleteOne({ _id: tokenHash });
}

export async function getLocalAccountByOpenId(openId: string): Promise<LocalAccount | null> {
  const db = await getDatabase();
  return db.collection<LocalAccount>("localAccounts").findOne({ openId });
}

function isSnapshot(value: unknown): value is DashboardSnapshot {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<DashboardSnapshot>;
  const profile = data.profile;
  const summary = data.summary;
  return Boolean(
    profile && typeof profile.name === "string" && profile.name.length <= 120 &&
    typeof profile.screenReaderEnabled === "boolean" &&
    (profile.quietMode === undefined || typeof profile.quietMode === "boolean") &&
    Array.isArray(data.metrics) && data.metrics.length <= 20 && data.metrics.every(metric =>
      metric && typeof metric.key === "string" && typeof metric.label === "string" && metric.label.length <= 120 &&
      typeof metric.value === "string" && metric.value.length <= 120 && Number.isFinite(metric.progress) && metric.progress >= 0 && metric.progress <= 100) &&
    Array.isArray(data.activities) && data.activities.length <= 100 && data.activities.every(activity =>
      activity && typeof activity.id === "string" && activity.id.length <= 100 && typeof activity.title === "string" && activity.title.length <= 200 &&
      typeof activity.detail === "string" && activity.detail.length <= 1000 && Number.isFinite(activity.impact) && activity.impact >= 0 && activity.impact <= 10000 &&
      typeof activity.completed === "boolean") &&
    summary && Number.isFinite(summary.impactScore) && summary.impactScore >= 0 && summary.impactScore <= 1_000_000 &&
    typeof summary.impactDelta === "string" && summary.impactDelta.length <= 40 &&
    typeof summary.deepWork === "string" && summary.deepWork.length <= 40 &&
    typeof summary.deepWorkDelta === "string" && summary.deepWorkDelta.length <= 40 &&
    typeof summary.carbonSaved === "string" && summary.carbonSaved.length <= 40 &&
    typeof summary.carbonDelta === "string" && summary.carbonDelta.length <= 40 &&
    Number.isInteger(summary.streak) && summary.streak >= 0 && summary.streak <= 100_000,
  );
}

export async function getDashboard(userId: string): Promise<DashboardSnapshot | null> {
  const db = await getDatabase();
  const document = await db.collection<DashboardDocument>("dashboardSnapshots")
    .findOne({ _id: userId });
  return document?.snapshot ?? null;
}

export async function saveDashboard(userId: string, snapshot: unknown): Promise<void> {
  if (!isSnapshot(snapshot)) throw new Error("Invalid dashboard snapshot");
  const db = await getDatabase();
  await db.collection<DashboardDocument>("dashboardSnapshots").updateOne(
    { _id: userId },
    { $set: { snapshot, userId, updatedAt: new Date() } },
    { upsert: true },
  );
}

export type HealthRecord = {
  sleepHours: number;
  moderateMinutes: number;
  vigorousMinutes: number;
  strengthDays: number;
  recordedAt: string;
  source: "self_report";
  references: string[];
};

export async function getHealthRecord(userId: string): Promise<HealthRecord | null> {
  const db = await getDatabase();
  const doc = await db.collection<HealthRecord & { _id: string; userId: string }>("healthRecords").findOne({ _id: userId });
  if (!doc) return null;
  const { _id, userId: _owner, ...record } = doc;
  return record;
}

export async function saveHealthRecord(userId: string, record: HealthRecord): Promise<void> {
  const db = await getDatabase();
  await db.collection<HealthRecord & { _id: string; userId: string }>("healthRecords").updateOne(
    { _id: userId },
    { $set: { ...record, userId } },
    { upsert: true },
  );
}

type StoredHealthcareRecord = HealthcareRecord & { _id: string; userId: string };

export async function listHealthcareRecords(userId: string, dataset?: DatasetKey): Promise<HealthcareRecord[]> {
  const db = await getDatabase();
  const docs = await db.collection<StoredHealthcareRecord>("healthcareRecords")
    .find({ userId, ...(dataset ? { dataset } : {}) }).sort({ recordedAt: -1 }).limit(500).toArray();
  return docs.map(({ _id, userId: _owner, ...record }) => ({ ...record, id: _id }));
}

export async function insertHealthcareRecord(userId: string, record: HealthcareRecord): Promise<void> {
  const db = await getDatabase();
  await db.collection<StoredHealthcareRecord>("healthcareRecords").insertOne({ ...record, _id: record.id, userId });
}

export async function updateHealthcareRecord(userId: string, id: string, dataset: DatasetKey, values: HealthcareRecord["values"]): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.collection<StoredHealthcareRecord>("healthcareRecords").updateOne(
    { _id: id, userId, dataset }, { $set: { values, recordedAt: new Date().toISOString() } },
  );
  return result.matchedCount === 1;
}

export async function deleteHealthcareRecord(userId: string, id: string): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.collection<StoredHealthcareRecord>("healthcareRecords").deleteOne({ _id: id, userId });
  return result.deletedCount === 1;
}
