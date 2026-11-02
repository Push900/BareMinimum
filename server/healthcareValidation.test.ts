import { describe, expect, it } from "vitest";
import { validateHealthcareValues } from "./healthcareValidation";

describe("healthcare record input validation", () => {
  it("accepts valid wellness and procurement entries", () => {
    expect(validateHealthcareValues("body", { heightCm: 172, weightKg: 70, waistCm: 82 })).toBe(true);
    expect(validateHealthcareValues("procurement", { product: "Reusable tray", supplierCompliancePct: 85 })).toBe(true);
  });

  it("rejects out-of-range, non-finite, empty, and unknown fields", () => {
    expect(validateHealthcareValues("sleep", { sleepHours: 25 })).toBe(false);
    expect(validateHealthcareValues("hydration", { waterMl: Number.NaN })).toBe(false);
    expect(validateHealthcareValues("activity", {})).toBe(false);
    expect(validateHealthcareValues("body", { userId: "someone-else" })).toBe(false);
  });

  it("rejects inconsistent waste totals and overlong labels", () => {
    expect(validateHealthcareValues("waste", { totalKg: 10, sharpsKg: 8, generalKg: 4 })).toBe(false);
    expect(validateHealthcareValues("waste", { totalKg: 10, disposedKg: 12 })).toBe(false);
    expect(validateHealthcareValues("procurement", { product: "x".repeat(121) })).toBe(false);
  });
});
