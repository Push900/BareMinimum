import { useEffect, useMemo, useState } from "react";
import { datasets, guidanceSources, type DatasetKey, type HealthcareRecord } from "../models/healthcare";

const LOCAL_KEY = "bareminimum.healthcare-records.v1";
type SaveState = "idle" | "loading" | "saving" | "saved" | "error";
const demoExamples: Partial<Record<DatasetKey, Record<string, number | string>>> = {
  body: { heightCm: 168, weightKg: 66, waistCm: 78 },
  activity: { moderateMinutes: 120, vigorousMinutes: 30, strengthDays: 2, steps: 7200, activeMinutes: 42, sedentaryMinutes: 510 },
  hydration: { waterMl: 1450, targetMl: 1800 },
  sleep: { sleepHours: 7.5 },
  wearable: { steps: 7200, heartRate: 68, activeCalories: 340, exerciseMinutes: 42, sleepHours: 7.5 },
  worker: { workingHours: 40, shiftDuration: 8, consecutiveShifts: 4, breakMinutes: 45, overtimeHours: 2, patientsPerShift: 18, safetyIncidents: 0, needleStickIncidents: 0, workplaceInjuries: 0, trainingCompletionPct: 100, wellnessAssessment: 3 },
  waste: { totalKg: 24, sharpsKg: 1.2, infectiousKg: 5, pharmaceuticalKg: 0.4, chemicalKg: 0.3, generalKg: 17.1, segregatedCorrectlyKg: 22, recoveredKg: 3.5, disposedKg: 20, incidents: 0, patients: 120, wasteCategory: "Example outpatient unit" },
  resources: { ppe: 85, gloves: 240, masks: 90, syringes: 34, medicines: 310, packagingKg: 2.4, electricityKwh: 185, waterLitres: 900, singleUseItems: 380, reusableItems: 24, patients: 120 },
  food: { preparedKg: 42, servedKg: 36, returnedKg: 3.2, discardedKg: 4, mealsServed: 145, wastedFoodCost: 520, patients: 120 },
  procurement: { cost: 1800, packagingWeightKg: 0.8, recyclablePackagingPct: 70, expectedWasteKg: 0.2, lifespanDays: 365, transportDistanceKm: 250, supplierCompliancePct: 92, treatmentRequirementKg: 0.2, product: "Reusable instrument tray", supplier: "Example supplier", reusableStatus: "Reusable", treatmentRequirement: "Follow facility reprocessing procedure" },
};

function getLocalRecords(): HealthcareRecord[] {
  try { const value = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]"); return Array.isArray(value) ? value : []; }
  catch { return []; }
}

function calculated(dataset: DatasetKey, record?: HealthcareRecord) {
  if (!record) return [];
  const v = record.values;
  if (dataset === "body" && Number(v.heightCm) > 0 && Number(v.weightKg) > 0) {
    const bmi = Number(v.weightKg) / (Number(v.heightCm) / 100) ** 2;
    const category = bmi < 18.5 ? "below standard screening range" : bmi < 25 ? "standard screening range" : bmi < 30 ? "above standard screening range" : "higher screening range";
    return [["BMI", `${bmi.toFixed(1)} · ${category}`]];
  }
  if (dataset === "activity") {
    const eq = Number(v.moderateMinutes ?? 0) + 2 * Number(v.vigorousMinutes ?? 0);
    return [["Moderate-equivalent activity", `${eq} min/week`], ["Progress to 150 min", `${Math.min(100, Math.round(eq / 150 * 100))}%`], ["Strength progress", `${Math.min(100, Math.round(Number(v.strengthDays ?? 0) / 2 * 100))}%`]];
  }
  if (dataset === "hydration" && Number(v.targetMl) > 0) return [["Target completion", `${Math.min(100, Math.round(Number(v.waterMl ?? 0) / Number(v.targetMl) * 100))}%`]];
  if (dataset === "waste") {
    const total = Number(v.totalKg ?? 0), patients = Number(v.patients ?? 0);
    return [["Waste per patient", patients ? `${(total / patients).toFixed(2)} kg` : "Add patients served"], ["Segregation accuracy", total ? `${Math.round(Number(v.segregatedCorrectlyKg ?? 0) / total * 100)}%` : "Add total waste"], ["Treatment/disposal recorded", total ? `${Math.round(Number(v.disposedKg ?? 0) / total * 100)}%` : "Add total waste"]];
  }
  if (dataset === "food") {
    const prepared = Number(v.preparedKg ?? 0);
    return [["Food waste", prepared ? `${Math.round(Number(v.discardedKg ?? 0) / prepared * 100)}% of prepared` : "Add prepared food"], ["Waste per patient", Number(v.patients) ? `${(Number(v.discardedKg ?? 0) / Number(v.patients)).toFixed(2)} kg` : "Add patients served"]];
  }
  if (dataset === "resources" && Number(v.patients) > 0) return [["Tracked resources per patient", `${((Number(v.ppe ?? 0) + Number(v.gloves ?? 0) + Number(v.masks ?? 0) + Number(v.syringes ?? 0)) / Number(v.patients)).toFixed(1)} items`]];
  return [];
}

export function HealthcareWorkspace() {
  const [records, setRecords] = useState<HealthcareRecord[]>([]);
  const [datasetKey, setDatasetKey] = useState<DatasetKey>("body");
  const [values, setValues] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [status, setStatus] = useState<SaveState>("loading");
  const [message, setMessage] = useState("Loading records…");
  const [source, setSource] = useState<"local" | "synced" | "mixed">("local");
  const [error, setError] = useState("");
  const definition = datasets.find(item => item.key === datasetKey)!;
  const matching = useMemo(() => records.filter(item => item.dataset === datasetKey).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)), [records, datasetKey]);
  const latest = matching[0];
  const monthly = useMemo(() => {
    if (!["waste", "resources", "food"].includes(datasetKey)) return [] as { month: string; total: number; entries: number }[];
    const totals = new Map<string, { total: number; entries: number }>();
    const key = datasetKey === "waste" ? "totalKg" : datasetKey === "food" ? "discardedKg" : "packagingKg";
    for (const record of matching) {
      const date = new Date(record.recordedAt);
      const month = new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short" }).format(date);
      const item = totals.get(month) ?? { total: 0, entries: 0 };
      item.total += Number(record.values[key] ?? 0); item.entries += 1; totals.set(month, item);
    }
    return [...totals].slice(0, 6).map(([month, value]) => ({ month, ...value }));
  }, [matching, datasetKey]);

  const persistLocal = (next: HealthcareRecord[]) => {
    setRecords(next);
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(next)); } catch { /* Storage may be disabled by the browser. */ }
    setSource("local");
  };

  const load = async (selected: DatasetKey) => {
    setStatus("loading"); setMessage("Loading history…");
    try {
      const response = await fetch("/api/healthcare-records");
      if (!response.ok) throw new Error("local-only");
      const data = await response.json() as { records: HealthcareRecord[] };
      const allLocal = getLocalRecords();
      const localOnly = allLocal.filter(record => record.source === "local_only");
      const next = [...data.records, ...localOnly]; setRecords(next); localStorage.setItem(LOCAL_KEY, JSON.stringify(localOnly));
      setSource(localOnly.length && data.records.length ? "mixed" : localOnly.length ? "local" : "synced");
      setMessage(localOnly.length ? "Account history loaded; local-only entries remain on this device" : data.records.length ? "Private account records loaded" : "No records yet. Add the first dated entry below.");
    } catch {
      const local = getLocalRecords().filter(record => record.source === "local_only"); setRecords(local); setSource("local");
      setMessage(local.some(record => record.dataset === selected) ? "Showing records saved on this device" : "No records yet. Add the first dated entry below.");
    } finally { setStatus("idle"); }
  };

  useEffect(() => { void load(datasetKey); }, [datasetKey]);

  const beginEdit = (record: HealthcareRecord) => {
    setDatasetKey(record.dataset); setEditing(record.id);
    setValues(Object.fromEntries(Object.entries(record.values).map(([key, value]) => [key, String(value)])));
    document.getElementById("record-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setError("");
    const nextValues: Record<string, number | string> = {};
    for (const field of definition.fields) {
      const raw = values[field.key];
      if (raw === undefined || raw === "") continue;
      const value = Number(raw);
      if (!Number.isFinite(value) || value < field.min || value > field.max) { setError(`${field.label} must be between ${field.min} and ${field.max} ${field.unit}.`); return; }
      nextValues[field.key] = value;
    }
    for (const field of definition.textFields ?? []) {
      const value = values[field.key]?.trim();
      if (value) {
        if (value.length > field.maxLength) { setError(`${field.label} must be ${field.maxLength} characters or fewer.`); return; }
        nextValues[field.key] = value;
      }
    }
    if (!Object.keys(nextValues).length) { setError("Enter at least one value before saving."); return; }
    const existing = editing ? records.find(item => item.id === editing) : undefined;
    const record: HealthcareRecord = { id: editing ?? crypto.randomUUID(), dataset: datasetKey, values: nextValues, recordedAt: new Date().toISOString(), source: existing?.source === "local_only" ? "local_only" : "self_report" };
    setStatus("saving"); setMessage("Saving…");
    try {
      if (record.source === "local_only") throw new Error("local-only");
      const response = await fetch(editing ? `/api/healthcare-records/${editing}` : "/api/healthcare-records", {
        method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataset: datasetKey, values: nextValues }),
      });
      if (response.status === 400) { const body = await response.json(); throw new Error(body.error ?? "Please check the values."); }
      if (!response.ok) throw new Error("local-only");
      setRecords(current => [record, ...current.filter(item => item.id !== record.id)]); setSource("synced");
      setMessage("Saved to your private account"); setStatus("saved");
    } catch (cause) {
      if (cause instanceof Error && cause.message !== "local-only") { setError(cause.message); setStatus("error"); return; }
      const localRecord = { ...record, id: existing?.source === "self_report" ? crypto.randomUUID() : record.id, source: "local_only" as const };
      const next = editing ? getLocalRecords().map(item => item.id === record.id ? localRecord : item) : [localRecord, ...getLocalRecords()];
      persistLocal(next); setMessage("Saved on this device only · not connected to the server"); setStatus("saved");
    }
    setEditing(null); setValues({}); void load(datasetKey);
  };

  const groups = [...new Set(datasets.map(item => item.group))];
  const indicators = calculated(datasetKey, latest);
  const groupStats = groups.map(group => {
    const groupDatasets = datasets.filter(item => item.group === group);
    let recorded = 0, available = 0, entryCount = 0;
    for (const item of groupDatasets) {
      const fields = [...item.fields.map(field => field.key), ...(item.textFields ?? []).map(field => field.key)];
      available += fields.length;
      const last = records.filter(record => record.dataset === item.key).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0];
      if (last) { entryCount += records.filter(record => record.dataset === item.key).length; recorded += fields.filter(key => last.values[key] !== undefined && last.values[key] !== "").length; }
    }
    return { group, recorded, available, entryCount, percent: available ? Math.round(recorded / available * 100) : 0 };
  });

  return <section className="healthcare-workspace" id="health-wellness" aria-labelledby="healthcare-title">
    <div className="workspace-heading"><div><p className="eyebrow eyebrow--mint">CARE · PEOPLE · RESOURCES</p><h2 id="healthcare-title">Healthcare wellness &amp; sustainability</h2><p>Track dated inputs, review what changed, and see how each indicator is calculated.</p></div><span className={`workspace-sync ${source === "synced" ? "is-synced" : ""}`}>{source === "synced" ? "Private account sync" : source === "mixed" ? "Account + local entries" : "Local-only mode"}</span></div>
    <nav className="dataset-nav" aria-label="Healthcare sections">{groups.map(group => <a key={group} href={`#${group.startsWith("SDG 3") ? "personal-wellness" : group.startsWith("SDG 8") ? "worker-wellbeing" : "healthcare-sustainability"}`}>{group}</a>)}<a href="#trends-reports">Trends / reports</a></nav>
    <section className="sdg-record-overview" aria-label="SDG record coverage"><div className="sdg-record-overview__heading"><strong>SDG overview</strong><span>Record coverage from your latest entries; not an SDG score.</span></div>{groupStats.map(item => <article key={item.group}><div><strong>{item.group}</strong><span>{item.recorded} of {item.available} fields recorded · {item.entryCount} dated entries</span></div><b>{item.percent}%</b><span className="coverage-track"><i style={{ width: `${item.percent}%` }} /></span></article>)}</section>
    {groups.map(group => <div className="dataset-group" id={group.startsWith("SDG 3") ? "personal-wellness" : group.startsWith("SDG 8") ? "worker-wellbeing" : "healthcare-sustainability"} key={group}>
      <div className="dataset-group__title"><span>{group}</span><small>{group.startsWith("SDG 3") ? "What am I tracking? Personal measures and self-reported activity." : group.startsWith("SDG 8") ? "Worker-facing monitoring. No diagnoses or individual performance scores." : "Operational tracking. Reported measures are separate from calculated indicators."}</small></div>
      <div className="dataset-tabs">{datasets.filter(item => item.group === group).map(item => <button key={item.key} className={datasetKey === item.key ? "is-active" : ""} onClick={() => { setDatasetKey(item.key); setValues({}); setEditing(null); }}>{item.label}</button>)}</div>
    </div>)}
    <div className="workspace-columns">
      <form id="record-form" className="record-form card-surface" onSubmit={save}>
        <div className="card-heading-row"><div><p className="eyebrow">{definition.group}</p><h3>{editing ? "Update record" : `Add ${definition.label.toLowerCase()}`}</h3></div></div>
        <p className="card-description">{definition.description}</p>
        <div className="record-fields">{definition.fields.map(field => <label className="record-field" key={field.key}><span>{field.label}</span><div><input type="number" min={field.min} max={field.max} step={field.step ?? 1} value={values[field.key] ?? ""} placeholder="—" onChange={event => setValues(prev => ({ ...prev, [field.key]: event.target.value }))} /><small>{field.unit}</small></div></label>)}{(definition.textFields ?? []).map(field => <label className="record-field" key={field.key}><span>{field.label}</span><div><input type="text" maxLength={field.maxLength} value={values[field.key] ?? ""} placeholder="Enter details" onChange={event => setValues(prev => ({ ...prev, [field.key]: event.target.value }))} /></div></label>)}</div>
        {error && <p className="record-error" role="alert">{error}</p>}
        <div className="record-actions"><button className="primary-button" type="submit" disabled={status === "saving"}>{status === "saving" ? "Saving…" : editing ? "Update record" : "Save dated record"}</button>{editing && <button type="button" className="secondary-button" onClick={() => { setEditing(null); setValues({}); }}>Cancel</button>}</div>
        <p className="record-status" role="status">{status === "loading" ? "Loading… " : ""}{message}</p>
      </form>
      <section className="record-summary card-surface" aria-label="Current status and history">
        <div className="card-heading-row"><div><p className="eyebrow">CURRENT STATUS</p><h3>{latest ? "Latest recorded entry" : "No personal data yet"}</h3></div><span className="record-count">{matching.length} {matching.length === 1 ? "entry" : "entries"}</span></div>
        <p className="card-description">{latest ? `Self-reported · ${new Date(latest.recordedAt).toLocaleString()}` : "Your personal view starts when you save an entry. Sample values are not used as personal measurements."}</p>
        {indicators.length > 0 && <div className="indicator-list">{indicators.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>}
        {datasetKey === "worker" && latest && <p className="record-guidance">Recorded indicators: {latest.values.shiftDuration ?? "—"} hours/shift · {latest.values.breakMinutes ?? "—"} break minutes · {latest.values.patientsPerShift ?? "—"} patients/shift · {latest.values.overtimeHours ?? "—"} overtime hours. These are monitoring inputs and are not a fatigue or safety diagnosis.</p>}
        {datasetKey === "activity" && <p className="record-guidance">WHO adult guidance: 150–300 moderate minutes/week, or equivalent vigorous activity; moderate-equivalent = moderate + 2 × vigorous. Strength guidance: 2+ days/week. <span>Comparison only.</span></p>}
        {datasetKey === "sleep" && <p className="record-guidance">CDC says adults aged 18–60 generally need 7+ hours. Recommendations vary by age and individual. This is a comparison, not a diagnosis.</p>}
        {datasetKey === "body" && <p className="record-guidance">BMI is calculated as kg ÷ height(m)². Categories are screening classifications; BMI does not diagnose health status.</p>}
        {datasetKey === "hydration" && <p className="record-guidance">Hydration completion uses only the optional target you enter. This app does not set a universal fluid requirement.</p>}
        {monthly.length > 0 && <div className="monthly-trends"><h4>Monthly trend · {datasetKey === "waste" ? "reported waste" : datasetKey === "food" ? "reported food discarded" : "reported packaging"}</h4><p>Sum of entered records in each month; totals depend on how often you record.</p>{monthly.map(item => <div key={item.month}><span>{item.month} · {item.entries} entries</span><strong>{item.total.toFixed(1)} {datasetKey === "resources" ? "kg packaging" : "kg"}</strong></div>)}</div>}
        {!latest && demoExamples[datasetKey] && <div className="demo-example"><strong>Sample example · not a personal record</strong><p>Illustrative values only. This example is not saved, included in history, or synced.</p><span>{Object.entries(demoExamples[datasetKey]!).map(([key, value]) => `${definition.fields.find(field => field.key === key)?.label ?? definition.textFields?.find(field => field.key === key)?.label ?? key}: ${value}`).join(" · ")}</span></div>}
        <div className="record-history" id="trends-reports"><h4>History · most recent first</h4>{status === "loading" ? <p className="empty-history">Loading dated history…</p> : matching.length === 0 ? <p className="empty-history">No dated entries yet. Use the form to add the first one.</p> : matching.map(record => <article key={record.id} className="history-entry"><div><strong>{new Date(record.recordedAt).toLocaleDateString()}</strong><small>{record.source === "sample" ? "Sample" : record.source === "local_only" ? "Local-only · self-reported" : "Self-reported"} · {new Date(record.recordedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small><span>{Object.entries(record.values).map(([key, value]) => `${datasets.find(item => item.key === record.dataset)?.fields.find(field => field.key === key)?.label ?? datasets.find(item => item.key === record.dataset)?.textFields?.find(field => field.key === key)?.label ?? key}: ${value}`).join(" · ")}</span></div><button type="button" className="history-edit" onClick={() => beginEdit(record)} aria-label={`Edit record from ${new Date(record.recordedAt).toLocaleDateString()}`}>Edit</button></article>)}</div>
      </section>
    </div>
    <p className="workspace-disclaimer">BareMinimum is a wellness and monitoring tool. It is not a medical device and does not provide diagnosis or treatment. Wearable integration: <strong>not connected</strong>; wearable-ready fields are manual entry only. Guidance sources: {guidanceSources.map((item, index) => <span key={item.url}>{index > 0 && " · "}<a href={item.url} target="_blank" rel="noreferrer">{item.label}</a></span>)}.</p>
  </section>;
}
