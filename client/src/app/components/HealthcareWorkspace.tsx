import { useEffect, useMemo, useState } from "react";
import { datasets, guidanceSources, type DatasetKey, type HealthcareRecord } from "../models/healthcare";

const localKey = (userId: string | null) => `bareminimum.healthcare-records.v1:${userId ?? "anonymous"}`;
type SaveState = "idle" | "loading" | "saving" | "saved" | "error";
export type WorkspaceView = "overview" | "sdg3" | "sdg8" | "sdg12" | "timetable" | "trends";
const viewGroups: Record<WorkspaceView, string | null> = { overview: null, sdg3: "SDG 3", sdg8: "SDG 8", sdg12: "SDG 12", timetable: "TIMETABLE", trends: null };

function getLocalRecords(key: string): HealthcareRecord[] {
  try { const value = JSON.parse(localStorage.getItem(key) ?? "[]"); return Array.isArray(value) ? value : []; }
  catch { return []; }
}

function calculated(dataset: DatasetKey, record?: HealthcareRecord) {
  if (!record) return [];
  const v = record.values;
  if (dataset === "body" && Number(v.heightCm) > 0 && Number(v.weightKg) > 0) {
    const bmi = Number(v.weightKg) / (Number(v.heightCm) / 100) ** 2;
    const category = bmi < 18.5 ? "WHO adult BMI below 18.5" : bmi < 25 ? "WHO adult BMI 18.5–24.9" : bmi < 30 ? "WHO adult BMI 25.0–29.9" : "WHO adult BMI 30+";
    return [["BMI", `${bmi.toFixed(1)} · ${category}`]];
  }
  if (dataset === "activity") {
    const eq = Number(v.moderateMinutes ?? 0) + 2 * Number(v.vigorousMinutes ?? 0);
    return [["WHO moderate-equivalent activity", `${eq} min/week · moderate + 2 × vigorous`], ...(typeof v.sedentaryMinutes === "number" ? [["Sedentary time", `${(Number(v.sedentaryMinutes) / 60).toFixed(1)} hours/day · minutes ÷ 60`]] : [])];
  }
  if (dataset === "hydration" && Number(v.targetMl) > 0) return [["Hydration completion", `${(Number(v.waterMl ?? 0) / Number(v.targetMl) * 100).toFixed(1)}%`]];
  if (dataset === "worker") {
    const assigned = Number(v.trainingAssigned ?? 0), completed = Number(v.trainingCompleted ?? 0);
    return assigned ? [["Safety training completion", `${(completed / assigned * 100).toFixed(1)}% · ${completed} completed / ${assigned} assigned`]] : [];
  }
  if (dataset === "waste") {
    const total = Number(v.totalKg ?? 0), patients = Number(v.patients ?? 0);
    const checks = Number(v.segregationChecks ?? 0), correct = Number(v.correctSegregationChecks ?? 0);
    const treatments = Number(v.treatmentRecords ?? 0), completed = Number(v.completedTreatmentRecords ?? 0);
    return [["Waste per patient", patients ? `${(total / patients).toFixed(2)} kg/patient · total waste ÷ patients` : "Add patients served"], ...(checks ? [["Segregation accuracy", `${(correct / checks * 100).toFixed(1)}% · ${correct} correct / ${checks} records`]] : []), ...(treatments ? [["Treatment/disposal completion", `${(completed / treatments * 100).toFixed(1)}% · ${completed} completed / ${treatments} records`]] : [])];
  }
  if (dataset === "food") {
    const prepared = Number(v.preparedKg ?? 0);
    return [["Food waste", prepared ? `${Math.round(Number(v.discardedKg ?? 0) / prepared * 100)}% of prepared` : "Add prepared food"], ["Waste per patient", Number(v.patients) ? `${(Number(v.discardedKg ?? 0) / Number(v.patients)).toFixed(2)} kg` : "Add patients served"]];
  }
  if (dataset === "timetable") return [["Task status", v.completed ? "Completed" : "Planned"]];
  return [];
}

function TrendPlot({ records, fieldKey, label, unit }: { records: HealthcareRecord[]; fieldKey: string; label: string; unit: string }) {
  const points = [...records].filter(record => typeof record.values[fieldKey] === "number").sort((a,b) => a.recordedAt.localeCompare(b.recordedAt));
  if (!points.length) return <div className="trend-plot trend-plot--empty"><strong>{label}</strong><p>No data recorded for this measure. Add dated records to create a graph.</p></div>;
  const values = points.map(record => Number(record.values[fieldKey]));
  const min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
  const coords = values.map((value, index) => [40 + (points.length === 1 ? 260 : index * 520 / (points.length - 1)), 188 - (value - min) / span * 145] as const);
  const dates = points.map(record => new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(record.recordedAt)));
  return <div className="trend-plot">
    <div className="trend-plot__heading"><div><strong>{label} over time</strong><span>Self-reported · {points.length} dated {points.length === 1 ? "value" : "values"}</span></div><b>{values.at(-1)} {unit}</b></div>
    <svg viewBox="0 0 600 240" role="img" aria-label={`${label} over time in ${unit}. ${points.map((point, i) => `${dates[i]}: ${point.values[fieldKey]} ${unit}`).join("; ")}`}>
      <line x1="40" y1="188" x2="560" y2="188" className="trend-axis" />
      <line x1="40" y1="35" x2="40" y2="188" className="trend-axis" />
      {points.length > 1 && <polyline points={coords.map(([x,y]) => `${x},${y}`).join(" ")} className="trend-line" />}
      {coords.map(([x,y], index) => <g key={`${points[index].id}-${index}`}><circle cx={x} cy={y} r="5" className="trend-point" /><text x={x} y="211" textAnchor="middle" className="trend-label">{dates[index]}</text><text x={x} y={y - 10} textAnchor="middle" className="trend-value">{values[index]} {unit}</text></g>)}
    </svg>
    {points.length === 1 && <p className="trend-plot__hint">One dated value is recorded. Add another entry on a later date to see change over time.</p>}
    <p className="trend-plot__foot">{points[0] && new Date(points[0].recordedAt).toLocaleDateString()} – {points.at(-1) && new Date(points.at(-1)!.recordedAt).toLocaleDateString()} · Each point is an actual saved record.</p>
  </div>;
}

export function HealthcareWorkspace({ userId, view = "overview", onNavigate }: { userId: string | null; view?: WorkspaceView; onNavigate?: (view: WorkspaceView) => void }) {
  const [records, setRecords] = useState<HealthcareRecord[]>([]);
  const [datasetKey, setDatasetKey] = useState<DatasetKey>("body");
  const [trendFieldKey, setTrendFieldKey] = useState("weightKg");
  const [values, setValues] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [status, setStatus] = useState<SaveState>("loading");
  const [message, setMessage] = useState("Loading records…");
  const [source, setSource] = useState<"local" | "synced" | "mixed">("local");
  const [error, setError] = useState("");
  const storageKey = localKey(userId);
  const definition = datasets.find(item => item.key === datasetKey)!;
  const visibleDatasets = useMemo(() => view === "timetable" ? datasets.filter(item => item.key === "timetable") : view === "trends" ? datasets.filter(item => item.key !== "timetable") : datasets.filter(item => item.key !== "timetable" && (!viewGroups[view] || item.group.startsWith(viewGroups[view]!))), [view]);
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
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Storage may be disabled by the browser. */ }
    setSource("local");
  };

  const load = async (selected: DatasetKey) => {
    setStatus("loading"); setMessage("Loading history…");
    try {
      const response = await fetch("/api/healthcare-records", { credentials: "include" });
      if (!response.ok) throw new Error("local-only");
      const data = await response.json() as { records: HealthcareRecord[] };
      const allLocal = getLocalRecords(storageKey);
      const localOnly = allLocal.filter(record => record.source === "local_only");
      const next = [...data.records, ...localOnly]; setRecords(next); localStorage.setItem(storageKey, JSON.stringify(localOnly));
      setSource(localOnly.length && data.records.length ? "mixed" : localOnly.length ? "local" : "synced");
      setMessage(localOnly.length ? "Account history loaded; local-only entries remain on this device" : data.records.length ? "Private account records loaded" : "No records yet. Add the first dated entry below.");
    } catch {
      const local = getLocalRecords(storageKey).filter(record => record.source === "local_only"); setRecords(local); setSource("local");
      setMessage(userId ? "Account storage unavailable · showing device-only entries" : local.some(record => record.dataset === selected) ? "Showing records saved on this device" : "No records yet. Add the first dated entry below.");
    } finally { setStatus("idle"); }
  };

  useEffect(() => { setRecords([]); setEditing(null); setValues({}); void load(datasetKey); }, [datasetKey, storageKey]);
  useEffect(() => {
    if (view === "timetable") setDatasetKey("timetable");
    else if (view === "sdg3" && !datasets.find(item => item.key === datasetKey)?.group.startsWith("SDG 3")) setDatasetKey("body");
    else if (view === "sdg8" && !datasets.find(item => item.key === datasetKey)?.group.startsWith("SDG 8")) setDatasetKey("worker");
    else if (view === "sdg12" && !datasets.find(item => item.key === datasetKey)?.group.startsWith("SDG 12")) setDatasetKey("waste");
    else if (view === "trends" && datasetKey === "timetable") setDatasetKey("body");
  }, [view]);
  useEffect(() => {
    const fields = datasets.find(item => item.key === datasetKey)?.fields ?? [];
    if (!fields.some(field => field.key === trendFieldKey)) setTrendFieldKey(fields.find(field => matching.some(record => typeof record.values[field.key] === "number"))?.key ?? fields[0]?.key ?? "");
  }, [datasetKey, trendFieldKey, matching]);

  const beginEdit = (record: HealthcareRecord) => {
    setDatasetKey(record.dataset); setEditing(record.id);
    setValues(Object.fromEntries(Object.entries(record.values).map(([key, value]) => [key, String(value)])));
    document.getElementById("record-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setError("");
    const nextValues: Record<string, number | string | boolean> = {};
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
    for (const field of definition.dateFields ?? []) {
      const value = values[field.key]?.trim();
      if (value) {
        const parsed = new Date(`${value}T00:00:00.000Z`);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) { setError(`${field.label} must be a valid date.`); return; }
        nextValues[field.key] = value;
      }
    }
    for (const field of definition.booleanFields ?? []) {
      nextValues[field.key] = values[field.key] === "true";
    }
    if (datasetKey === "timetable" && (!nextValues.task || !nextValues.scheduledAt)) { setError("Enter a task and scheduled date."); return; }
    if (!Object.keys(nextValues).length) { setError("Enter at least one value before saving."); return; }
    const existing = editing ? records.find(item => item.id === editing) : undefined;
    const record: HealthcareRecord = { id: editing ?? crypto.randomUUID(), dataset: datasetKey, values: nextValues, recordedAt: new Date().toISOString(), source: existing?.source === "local_only" ? "local_only" : "self_report" };
    setStatus("saving"); setMessage("Saving…");
    try {
      if (record.source === "local_only") throw new Error("local-only");
      const response = await fetch(editing ? `/api/healthcare-records/${editing}` : "/api/healthcare-records", {
        method: editing ? "PUT" : "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataset: datasetKey, values: nextValues }),
      });
      if (response.status === 400) { const body = await response.json(); throw new Error(body.error ?? "Please check the values."); }
      if (!response.ok) throw new Error("local-only");
      setRecords(current => [record, ...current.filter(item => item.id !== record.id)]); setSource("synced");
      setMessage("Saved to your private account"); setStatus("saved");
    } catch (cause) {
      if (cause instanceof Error && cause.message !== "local-only") { setError(cause.message); setStatus("error"); return; }
      const localRecord = { ...record, id: existing?.source === "self_report" ? crypto.randomUUID() : record.id, source: "local_only" as const };
      const existingLocal = getLocalRecords(storageKey);
      const next = editing ? existingLocal.map(item => item.id === record.id ? localRecord : item) : [localRecord, ...existingLocal];
      persistLocal(next); setMessage("Saved on this device only · not connected to the server"); setStatus("saved");
    }
    setEditing(null); setValues({}); void load(datasetKey);
  };

  const groups = [...new Set(visibleDatasets.map(item => item.group))];
  const indicators = calculated(datasetKey, latest);
  const groupStats = groups.map(group => {
    const groupDatasets = datasets.filter(item => item.group === group);
    let recorded = 0, available = 0, entryCount = 0;
    for (const item of groupDatasets) {
      const fields = [...item.fields.map(field => field.key), ...(item.textFields ?? []).map(field => field.key), ...(item.dateFields ?? []).map(field => field.key), ...(item.booleanFields ?? []).map(field => field.key)];
      available += fields.length;
      const last = records.filter(record => record.dataset === item.key).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0];
      if (last) { entryCount += records.filter(record => record.dataset === item.key).length; recorded += fields.filter(key => last.values[key] !== undefined && last.values[key] !== "").length; }
    }
    return { group, recorded, available, entryCount, percent: available ? Math.round(recorded / available * 100) : 0 };
  });

    return <section className="healthcare-workspace" id="health-wellness" aria-labelledby="healthcare-title">
    <div className="workspace-heading"><div><p className="eyebrow eyebrow--mint">CARE · PEOPLE · RESOURCES</p><h2 id="healthcare-title">{view === "overview" ? "Overview" : view === "trends" ? "Trends / Reports" : view === "timetable" ? "Measurement timetable" : groups[0] ?? "Measurements"}</h2><p>{view === "overview" ? "What you have measured, calculated indicators, and what to record next." : view === "trends" ? "Dated records shown by the selected metric. Totals are based only on saved inputs." : "Track dated inputs, review what changed, and see how each indicator is calculated."}</p></div><span className={`workspace-sync ${source === "synced" ? "is-synced" : ""}`}>{source === "synced" ? "Private account sync" : source === "mixed" ? "Account + local entries" : "Local-only mode"}</span></div>
    {view === "overview" && <section className="sdg-record-overview" aria-label="Recorded entries">{groups.map(group => { const item = groupStats.find(stat => stat.group === group)!; return <article key={group}><div><strong>{group}</strong><span>{item.entryCount} dated entries · {item.recorded} fields in latest records</span></div><button className="history-edit" onClick={() => onNavigate?.(group.startsWith("SDG 3") ? "sdg3" : group.startsWith("SDG 8") ? "sdg8" : "sdg12")}>Open measures</button></article>; })}</section>}
    {view === "trends" && <div className="dataset-group"><div className="dataset-group__title"><span>Select a dated measure</span><small>Choose a metric and field to graph only saved values.</small></div><div className="dataset-tabs">{visibleDatasets.map(item => <button key={item.key} className={datasetKey === item.key ? "is-active" : ""} onClick={() => setDatasetKey(item.key)}>{item.label}</button>)}</div><label className="trend-field-select"><span>Metric</span><select value={trendFieldKey} onChange={event => setTrendFieldKey(event.target.value)}>{definition.fields.map(field => <option key={field.key} value={field.key}>{field.label} ({field.unit})</option>)}</select></label></div>}
    {view !== "overview" && view !== "trends" && groups.map(group => <div className="dataset-group" id={group.startsWith("SDG 3") ? "personal-wellness" : group.startsWith("SDG 8") ? "worker-wellbeing" : group.startsWith("SDG 12") ? "healthcare-sustainability" : "timetable"} key={group}>
      <div className="dataset-group__title"><span>{group}</span><small>{group.startsWith("SDG 3") ? "What am I tracking? Personal measures and self-reported activity." : group.startsWith("SDG 8") ? "Worker-facing monitoring. No diagnoses or individual performance scores." : "Operational tracking. Reported measures are separate from calculated indicators."}</small></div>
      <div className="dataset-tabs">{visibleDatasets.filter(item => item.group === group).map(item => <button key={item.key} className={datasetKey === item.key ? "is-active" : ""} onClick={() => { setDatasetKey(item.key); setValues({}); setEditing(null); }}>{item.label}</button>)}</div>
    </div>)}
    <div className="workspace-columns">
      <form id="record-form" className="record-form card-surface" onSubmit={save}>
        <div className="card-heading-row"><div><p className="eyebrow">{definition.group}</p><h3>{editing ? "Update record" : `Add ${definition.label.toLowerCase()}`}</h3></div></div>
        <p className="card-description">{definition.description}</p>
        <div className="record-fields">{definition.fields.map(field => <label className="record-field" key={field.key}><span>{field.label}</span><div><input type="number" min={field.min} max={field.max} step={field.step ?? 1} value={values[field.key] ?? ""} placeholder="—" onChange={event => setValues(prev => ({ ...prev, [field.key]: event.target.value }))} /><small>{field.unit}</small></div></label>)}{(definition.textFields ?? []).map(field => <label className="record-field" key={field.key}><span>{field.label}</span><div>{field.key === "task" ? <select value={values[field.key] ?? ""} onChange={event => setValues(prev => ({ ...prev, [field.key]: event.target.value }))}><option value="">Choose a concrete measurement task</option>{["Log water — ml/day", "Record sleep — hours/night", "Update moderate activity — minutes/week", "Record weight — kg", "Record waist — cm", "Log biomedical waste — kg/day", "Record waste segregation — correct/incorrect", "Record shift duration — hours", "Record overtime — hours", "Enter food discarded — kg/day"].map(task => <option key={task}>{task}</option>)}</select> : <input type="text" maxLength={field.maxLength} value={values[field.key] ?? ""} placeholder="Enter details" onChange={event => setValues(prev => ({ ...prev, [field.key]: event.target.value }))} />}</div></label>)}{(definition.dateFields ?? []).map(field => <label className="record-field" key={field.key}><span>{field.label}</span><div><input type="date" value={values[field.key] ?? ""} onChange={event => setValues(prev => ({ ...prev, [field.key]: event.target.value }))} /></div></label>)}{(definition.booleanFields ?? []).map(field => <label className="record-field" key={field.key}><span>{field.label}</span><div><input type="checkbox" checked={values[field.key] === "true"} onChange={event => setValues(prev => ({ ...prev, [field.key]: String(event.target.checked) }))} /></div></label>)}</div>
        {error && <p className="record-error" role="alert">{error}</p>}
        <div className="record-actions"><button className="primary-button" type="submit" disabled={status === "saving"}>{status === "saving" ? "Saving…" : editing ? "Update record" : "Save dated record"}</button>{editing && <button type="button" className="secondary-button" onClick={() => { setEditing(null); setValues({}); }}>Cancel</button>}</div>
        <p className="record-status" role="status">{status === "loading" ? "Loading… " : ""}{message}</p>
      </form>
      <section className="record-summary card-surface" aria-label="Current status and history">
        <div className="card-heading-row"><div><p className="eyebrow">CURRENT STATUS</p><h3>{latest ? "Latest recorded entry" : "No personal data yet"}</h3></div><span className="record-count">{matching.length} {matching.length === 1 ? "entry" : "entries"}</span></div>
        <p className="card-description">{latest ? `Self-reported · ${new Date(latest.recordedAt).toLocaleString()}` : "Your personal view starts when you save an entry. Sample values are not used as personal measurements."}</p>
        {indicators.length > 0 && <div className="indicator-list">{indicators.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>}
        {datasetKey === "worker" && latest && <p className="record-guidance">Recorded indicators: {latest.values.shiftDuration ?? "—"} hours/shift · {latest.values.breakMinutes ?? "—"} break minutes · {latest.values.patientsPerShift ?? "—"} patients/shift · {latest.values.overtimeHours ?? "—"} overtime hours. These are monitoring inputs and are not a fatigue or safety diagnosis.</p>}
        {datasetKey === "activity" && <p className="record-guidance">WHO adult guidance: 150–300 moderate minutes/week, or equivalent vigorous activity; this app calculates moderate-equivalent minutes as moderate + 2 × vigorous. Adults should also do muscle-strengthening activity on 2+ days/week. Comparison only, not a personal medical recommendation.</p>}
        {datasetKey === "sleep" && <p className="record-guidance">CDC says adults aged 18–60 generally need 7+ hours. Recommendations vary by age and individual. This is a comparison, not a diagnosis.</p>}
        {datasetKey === "body" && <p className="record-guidance">BMI is calculated as kg ÷ height(m)². Categories are screening classifications; BMI does not diagnose health status.</p>}
        {datasetKey === "hydration" && <p className="record-guidance">Hydration completion = water consumed ÷ the optional personal target × 100. ICMR-NIN discusses about 8 glasses (approximately 2 litres) of water including beverages for a general healthy person; needs vary with heat, activity and individual circumstances. This is contextual guidance, not a personalized target.</p>}
        {monthly.length > 0 && <div className="monthly-trends"><h4>Monthly trend · {datasetKey === "waste" ? "reported waste" : datasetKey === "food" ? "reported food discarded" : "reported packaging"}</h4><p>Sum of entered records in each month; totals depend on how often you record.</p>{monthly.map(item => <div key={item.month}><span>{item.month} · {item.entries} entries</span><strong>{item.total.toFixed(1)} {datasetKey === "resources" ? "kg packaging" : "kg"}</strong></div>)}</div>}
        {view === "overview" && <div className="metric-card-grid"><h3>What have I measured?</h3>{datasets.filter(item => item.key !== "timetable").flatMap(item => { const record = records.filter(entry => entry.dataset === item.key).sort((a,b) => b.recordedAt.localeCompare(a.recordedAt))[0]; return item.fields.map(field => { const hasValue = record?.values[field.key] !== undefined; return <article className="metric-card" key={`${item.key}-${field.key}`}><small>{item.group}</small><strong>{field.label}</strong><b>{hasValue ? record!.values[field.key] : "No data recorded"} {hasValue && <span>{field.unit}</span>}</b><small>Recording frequency: {field.unit.includes("/") ? field.unit.split("/").at(-1) : "per dated entry"}</small><small>Last recorded: {hasValue ? new Date(record!.recordedAt).toLocaleDateString() : "Never"} · Source: {hasValue ? record!.source === "local_only" ? "local self-report" : record!.source === "manual" ? "manual entry" : "self-reported" : "none"}</small>{!hasValue && <button className="history-edit" onClick={() => onNavigate?.(item.group.startsWith("SDG 3") ? "sdg3" : item.group.startsWith("SDG 8") ? "sdg8" : "sdg12")}>Record {field.label.toLowerCase()}</button>}</article>; }); })}
          <h3>Calculated indicators</h3>{datasets.filter(item => item.key !== "timetable").flatMap(item => { const dated = records.filter(entry => entry.dataset === item.key).sort((a,b) => b.recordedAt.localeCompare(a.recordedAt)); const record = dated[0]; const indicators = calculated(item.key, record); if (item.key === "body" && dated.length > 1 && typeof dated[0].values.weightKg === "number" && typeof dated[1].values.weightKg === "number") indicators.push(["Weight change between latest two records", `${(Number(dated[0].values.weightKg) - Number(dated[1].values.weightKg)).toFixed(1)} kg`]); return indicators.map(([label, value]) => { const formula = item.key === "body" ? label.startsWith("Weight change") ? "Formula: newer recorded weight − previous recorded weight. Both entry dates are shown in history." : "Formula: weight (kg) ÷ height (m)² · adult screening reference: WHO BMI categories" : item.key === "activity" ? label === "Sedentary time" ? "Formula: entered sedentary minutes/day ÷ 60 · derived from your dated input" : "Formula: moderate minutes/week + 2 × vigorous minutes/week · WHO adult activity guidance" : item.key === "hydration" ? "Formula: water consumed ÷ personal target × 100. Target is user-entered." : item.key === "waste" ? label === "Waste per patient" ? "Formula: total waste (kg) ÷ patients served in the same dated entry" : label === "Segregation accuracy" ? "Formula: correctly segregated records ÷ all segregation records × 100" : "Formula: completed treatment/disposal records ÷ all treatment/disposal records × 100" : item.key === "food" ? label === "Food waste" ? "Formula: food discarded (kg) ÷ food prepared (kg) × 100" : "Formula: food discarded (kg) ÷ patients served in the same dated entry" : "Formula: training completed ÷ training assigned × 100"; return <article className="metric-card metric-card--calculated" key={`${item.key}-${label}`}><small>{item.group} · calculated</small><strong>{label}</strong><b>{value}</b><small>Frequency: same reporting period as the saved inputs · Last recorded: {record ? new Date(record.recordedAt).toLocaleDateString() : "Never"} · Source: system-calculated</small><small>{formula}</small></article>; }); })}
          <h3>What do I need to record next?</h3>
        </div>}
        {view === "timetable" && <div className="record-guidance"><strong>Measurement task</strong><p>Choose a concrete task such as “Log water — ml/day”, “Record sleep — hours/night”, “Record weight — kg”, “Log biomedical waste — kg/day”, or “Record shift duration — hours”. When due, enter the value in its matching measurement form. Timetable items are reminders, not measurements.</p></div>}
        {view === "trends" && <TrendPlot records={matching} fieldKey={trendFieldKey} label={definition.fields.find(field => field.key === trendFieldKey)?.label ?? "Measure"} unit={definition.fields.find(field => field.key === trendFieldKey)?.unit ?? ""} />}
        <div className="record-history" id="trends-reports"><h4>{view === "trends" ? `Dated history · ${definition.label}` : "History · most recent first"}</h4>{status === "loading" ? <p className="empty-history">Loading dated history…</p> : matching.length === 0 ? <p className="empty-history">No data recorded. {view === "trends" ? "Select another metric or add dated entries." : "Use the form to add the first one."}</p> : matching.map(record => <article key={record.id} className="history-entry"><div><strong>{new Date(record.recordedAt).toLocaleDateString()}</strong><small>{record.source === "local_only" ? "Local-only · self-reported" : record.source === "manual" ? "Manual entry" : "Self-reported"} · {new Date(record.recordedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small><span>{Object.entries(record.values).map(([key, value]) => { const field = datasets.find(item => item.key === record.dataset)?.fields.find(item => item.key === key); return `${field?.label ?? key}: ${value}${field?.unit ? ` ${field.unit}` : ""}`; }).join(" · ")}</span></div><button type="button" className="history-edit" onClick={() => beginEdit(record)} aria-label={`Edit record from ${new Date(record.recordedAt).toLocaleDateString()}`}>Edit</button></article>)}</div>
      </section>
    </div>
    <p className="workspace-disclaimer">BareMinimum is a wellness and monitoring tool. It is not a medical device and does not provide diagnosis or treatment. Wearable integration: <strong>not connected</strong>; wearable-ready fields are manual entry only. Guidance sources: {guidanceSources.map((item, index) => <span key={item.url}>{index > 0 && " · "}<a href={item.url} target="_blank" rel="noreferrer">{item.label}</a></span>)}.</p>
  </section>;
}
