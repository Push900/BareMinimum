import type { DashboardSnapshot } from "../models/dashboard";
import { dashboardSnapshot } from "../models/dashboard";

const DASHBOARD_CACHE_KEY = "bareminimum.dashboard.snapshot";

function isDashboardSnapshot(value: unknown): value is DashboardSnapshot {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<DashboardSnapshot>;
  return Boolean(
    candidate.profile &&
      Array.isArray(candidate.metrics) &&
      Array.isArray(candidate.activities) &&
      candidate.summary &&
      typeof candidate.summary.impactScore === "number",
  );
}

/**
 * Frontend-only repository seam. Replace these functions with API calls once
 * MongoDB collections and authentication are connected; UI components do not
 * need to know whether the source is local cache or a remote document store.
 */
export function getDashboardSnapshot(): DashboardSnapshot {
  if (typeof window === "undefined") return dashboardSnapshot;

  try {
    const cached = window.localStorage.getItem(DASHBOARD_CACHE_KEY);
    if (cached) {
      const parsed: unknown = JSON.parse(cached);
      if (isDashboardSnapshot(parsed)) return parsed;
      window.localStorage.removeItem(DASHBOARD_CACHE_KEY);
    }
  } catch {
    // Keep the first-run experience usable if storage is unavailable.
  }

  return dashboardSnapshot;
}

export function saveDashboardSnapshot(snapshot: DashboardSnapshot): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    // Persistence is best-effort until the MongoDB API is connected.
  }
}

export function toMongoDocument(snapshot: DashboardSnapshot) {
  return {
    profile: snapshot.profile,
    metrics: snapshot.metrics,
    activities: snapshot.activities,
    summary: snapshot.summary,
    updatedAt: new Date().toISOString(),
  };
}
