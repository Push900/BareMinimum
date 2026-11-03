import { datasets, type DatasetKey } from "../client/src/app/models/healthcare";

export function validateHealthcareValues(dataset: DatasetKey, values: unknown): values is Record<string, number | string | boolean> {
  if (!values || typeof values !== "object" || Array.isArray(values)) return false;
  const definition = datasets.find((item) => item.key === dataset);
  if (!definition) return false;
  const entries = Object.entries(values);
  const validFields = entries.length > 0 && entries.every(([key, value]) => {
    const field = definition.fields.find((item) => item.key === key);
    if (field) return typeof value === "number" && Number.isFinite(value) && value >= field.min && value <= field.max;
    const textField = definition.textFields?.find((item) => item.key === key);
    if (textField) return typeof value === "string" && value.length <= textField.maxLength;
    const dateField = definition.dateFields?.find((item) => item.key === key);
    if (dateField) {
      if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
      const parsed = new Date(`${value}T00:00:00.000Z`);
      return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
    }
    const booleanField = definition.booleanFields?.find((item) => item.key === key);
    return Boolean(booleanField && typeof value === "boolean");
  });
  if (!validFields) return false;

  const data = values as Record<string, number | string | boolean>;
  if (dataset === "timetable" && (typeof data.task !== "string" || !data.task.trim() || typeof data.scheduledAt !== "string")) return false;
  if (dataset === "waste" && typeof data.totalKg === "number") {
    for (const key of ["segregatedCorrectlyKg", "recoveredKg", "disposedKg"]) {
      if (typeof data[key] === "number" && data[key] > data.totalKg) return false;
    }
    const categories = ["sharpsKg", "infectiousKg", "pharmaceuticalKg", "chemicalKg", "generalKg"]
      .map((key) => data[key]).filter((value): value is number => typeof value === "number");
    if (categories.reduce((sum, value) => sum + value, 0) > data.totalKg) return false;
  }
  return true;
}
