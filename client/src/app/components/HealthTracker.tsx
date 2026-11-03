import { useEffect, useState } from "react";
import { useAuth } from "../../_core/hooks/useAuth";

type RecordData = { sleepHours: number; moderateMinutes: number; vigorousMinutes: number; strengthDays: number; recordedAt: string };
const empty: RecordData = { sleepHours: 0, moderateMinutes: 0, vigorousMinutes: 0, strengthDays: 0, recordedAt: "" };

export function HealthTracker() {
  const { user } = useAuth();
  const key = `bareminimum.health-record.v1:${user?.openId ?? "anonymous"}`;
  const [record, setRecord] = useState<RecordData>(empty);
  const [status, setStatus] = useState("Loading your private record…");
  useEffect(() => {
    let active = true;
    setRecord(empty);
    try { const raw = localStorage.getItem(key); if (raw) setRecord(JSON.parse(raw)); } catch { /* Ignore corrupt browser cache. */ }
    fetch("/api/health-record", { credentials: "include" }).then(async response => {
      if (!response.ok) throw new Error("local");
      const data = await response.json();
      if (!active) return;
      if (data.record) { setRecord(data.record); localStorage.setItem(key, JSON.stringify(data.record)); }
      else { setRecord(empty); localStorage.removeItem(key); }
      setStatus("Synced to your private account");
    }).catch(() => { if (active) setStatus(user ? "MongoDB unavailable · saved on this device only." : "Saved on this device only. Sign in to sync privately."); });
    return () => { active = false; };
  }, [key]);
  const change = (key: keyof Pick<RecordData, "sleepHours" | "moderateMinutes" | "vigorousMinutes" | "strengthDays">, value: string) => setRecord(prev => ({ ...prev, [key]: Number(value) }));
  const save = async () => {
    const next = { ...record, recordedAt: new Date().toISOString() };
    setRecord(next); localStorage.setItem(key, JSON.stringify(next));
    try {
      const response = await fetch("/api/health-record", { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ record: next }) });
      setStatus(response.ok ? "Saved locally and synced to your private account" : user ? "MongoDB unavailable · saved on this device only." : "Saved on this device only. Sign in to sync privately.");
    } catch { setStatus(user ? "MongoDB unavailable · saved on this device only." : "Saved on this device only. Sign in to sync privately."); }
  };
  const equivalent = record.moderateMinutes + 2 * record.vigorousMinutes;
  const input = (label: string, key: keyof Pick<RecordData, "sleepHours" | "moderateMinutes" | "vigorousMinutes" | "strengthDays">, max: number, step = 1) => <label className="health-field">{label}<input type="number" min="0" max={max} step={step} value={record[key]} onChange={e => change(key, e.target.value)} /></label>;
  return <section className="health-tracker">
    <p><strong>Track your baseline</strong> <small>Self-reported; not a diagnosis or device measurement.</small></p>
    <div className="health-fields">{input("Last night's sleep (hours)", "sleepHours", 24, 0.25)}{input("Moderate activity this week (min)", "moderateMinutes", 1000)}{input("Vigorous activity this week (min)", "vigorousMinutes", 1000)}{input("Strength days this week", "strengthDays", 7)}</div>
    <p className="health-guidance">Aerobic total: {equivalent} moderate-equivalent min/week (150 recommended; 300 can add benefit). Strength: aim for 2+ days. Adults ages 18-60 generally need 7+ hours of sleep; age-specific sleep needs vary.</p>
    <button className="action-dialog__primary" onClick={save}>Save my health baseline</button><small className="health-status">{status}</small>
    <p className="health-sources">Sources: <a href="https://www.cdc.gov/sleep/about/" target="_blank" rel="noreferrer">CDC sleep guidance</a> · <a href="https://www.who.int/initiatives/behealthy/physical-activity/" target="_blank" rel="noreferrer">WHO activity guidance</a> · <a href="https://www.cdc.gov/physical-activity-basics/guidelines/adults.html" target="_blank" rel="noreferrer">CDC adult activity</a></p>
  </section>;
}
