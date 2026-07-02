import { describe, expect, it } from "bun:test";
import { discoveryContextSchema } from "@/schemas/discovery";
import { checkDiscoveryReadiness, mergeDiscoveryContext } from "@/workflows/discovery";

describe("checkDiscoveryReadiness", () => {
  it("returns ready when all required fields are present", () => {
    const ctx = discoveryContextSchema.parse({
      goal: "Build a billing system",
      actors: ["admin", "user"],
      successMeasures: ["invoices generated without errors"],
    });

    const result = checkDiscoveryReadiness(ctx, 0);
    expect(result.ready).toBe(true);
    expect(result.missingFields).toHaveLength(0);
  });

  it("returns not ready when goal is missing", () => {
    const ctx = discoveryContextSchema.parse({
      actors: ["admin"],
      successMeasures: ["metric one"],
    });

    const result = checkDiscoveryReadiness(ctx, 0);
    expect(result.ready).toBe(false);
    expect(result.missingFields).toContain("goal");
  });

  it("returns not ready when actors are missing", () => {
    const ctx = discoveryContextSchema.parse({
      goal: "Build auth",
      successMeasures: ["users can log in"],
    });

    const result = checkDiscoveryReadiness(ctx, 0);
    expect(result.ready).toBe(false);
    expect(result.missingFields.some((f) => f.includes("actors"))).toBe(true);
  });

  it("returns not ready when successMeasures are missing", () => {
    const ctx = discoveryContextSchema.parse({
      goal: "Build auth",
      actors: ["user"],
    });

    const result = checkDiscoveryReadiness(ctx, 0);
    expect(result.ready).toBe(false);
    expect(result.missingFields.some((f) => f.includes("successMeasures"))).toBe(true);
  });

  it("reports open questions count in result", () => {
    const ctx = discoveryContextSchema.parse({
      goal: "Build auth",
      actors: ["user"],
      successMeasures: ["users can log in"],
    });

    const result = checkDiscoveryReadiness(ctx, 3);
    expect(result.openQuestionsCount).toBe(3);
  });
});

describe("mergeDiscoveryContext", () => {
  it("merges actors without duplicates", () => {
    const existing = discoveryContextSchema.parse({
      goal: "Build billing",
      actors: ["admin"],
      successMeasures: ["invoices generated"],
    });

    const merged = mergeDiscoveryContext(existing, { actors: ["admin", "user"] });
    expect(merged.actors).toEqual(["admin", "user"]);
  });

  it("updates goal when provided", () => {
    const existing = discoveryContextSchema.parse({
      goal: "Old goal",
      actors: ["admin"],
      successMeasures: ["metric"],
    });

    const merged = mergeDiscoveryContext(existing, { goal: "New goal" });
    expect(merged.goal).toBe("New goal");
  });

  it("preserves existing fields when patch omits them", () => {
    const existing = discoveryContextSchema.parse({
      goal: "Keep this goal",
      actors: ["admin"],
      constraints: ["GDPR"],
      successMeasures: ["metric"],
    });

    const merged = mergeDiscoveryContext(existing, { actors: ["user"] });
    expect(merged.goal).toBe("Keep this goal");
    expect(merged.constraints).toEqual(["GDPR"]);
  });
});
