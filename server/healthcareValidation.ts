import { datasets, type DatasetKey } from "../client/src/app/models/healthcare";

export function validateHealthcareValues(dataset: DatasetKey, values: unknown): values is Record<string, number | string> {
  if (!values || typeof values !== "object" || Array.isArray(values)) return false;
  const definition = datasets.find((item) => item.key === dataset);
  if (!definition) return false;
  const entries = Object.entries(values);
  const validFields = entries.length > 0 && entries.every(([key, value]) => {
    const field = definition.fields.find((item) => item.key === key);
    if (field) return typeof value === "number" && Number.isFinite(value) && value >= field.min && value <= field.max;
    const textField = definition.textFields?.find((item) => item.key === key);
    return Boolean(textField && typeof value === "string" && value.length <= textField.maxLength);
  });
  if (!validFields) return false;

  const data = values as Record<string, number | string>;
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
