import { describe, expect, it } from "bun:test";
import { discoveryContextSchema } from "@/schemas/discovery";
import {
  checkDiscoveryReadiness,
  computeDraftingReadinessState,
  isConfirmedReadyForDrafting,
  mergeDiscoveryContext,
} from "@/workflows/discovery";

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

  it("resets readyForDrafting to false when goal changes after confirmation", () => {
    const existing = discoveryContextSchema.parse({
      goal: "Old goal",
      actors: ["admin"],
      successMeasures: ["metric"],
      readyForDrafting: true,
    });

    const merged = mergeDiscoveryContext(existing, { goal: "New goal" });
    expect(merged.readyForDrafting).toBe(false);
  });

  it("resets readyForDrafting to false when actors change after confirmation", () => {
    const existing = discoveryContextSchema.parse({
      goal: "Goal",
      actors: ["admin"],
      successMeasures: ["metric"],
      readyForDrafting: true,
    });

    const merged = mergeDiscoveryContext(existing, { actors: ["user"] });
    expect(merged.readyForDrafting).toBe(false);
  });

  it("resets readyForDrafting to false when constraints, assumptions, or successMeasures change", () => {
    const existing = discoveryContextSchema.parse({
      goal: "Goal",
      actors: ["admin"],
      successMeasures: ["metric"],
      readyForDrafting: true,
    });

    expect(mergeDiscoveryContext(existing, { constraints: ["GDPR"] }).readyForDrafting).toBe(false);
    expect(mergeDiscoveryContext(existing, { assumptions: ["assumption"] }).readyForDrafting).toBe(false);
    expect(mergeDiscoveryContext(existing, { successMeasures: ["new metric"] }).readyForDrafting).toBe(false);
  });

  it("preserves readyForDrafting when patch touches no core fields", () => {
    const existing = discoveryContextSchema.parse({
      goal: "Goal",
      actors: ["admin"],
      successMeasures: ["metric"],
      readyForDrafting: true,
    });

    const merged = mergeDiscoveryContext(existing, {});
    expect(merged.readyForDrafting).toBe(true);
  });

  it("preserves readyForDrafting when patch re-adds an actor that already exists (no-op update)", () => {
    const existing = discoveryContextSchema.parse({
      goal: "Goal",
      actors: ["Finance manager"],
      successMeasures: ["metric"],
      readyForDrafting: true,
    });

    const merged = mergeDiscoveryContext(existing, { actors: ["Finance manager"] });
    expect(merged.actors).toEqual(["Finance manager"]);
    expect(merged.readyForDrafting).toBe(true);
  });

  it("preserves readyForDrafting when patch re-sets goal to the same value (no-op update)", () => {
    const existing = discoveryContextSchema.parse({
      goal: "Same goal",
      actors: ["admin"],
      successMeasures: ["metric"],
      readyForDrafting: true,
    });

    const merged = mergeDiscoveryContext(existing, { goal: "Same goal" });
    expect(merged.readyForDrafting).toBe(true);
  });

  it("preserves readyForDrafting when constraints/assumptions/successMeasures patch is a subset of existing values", () => {
    const existing = discoveryContextSchema.parse({
      goal: "Goal",
      actors: ["admin"],
      constraints: ["GDPR", "HIPAA"],
      assumptions: ["Users have accounts"],
      successMeasures: ["metric one", "metric two"],
      readyForDrafting: true,
    });

    const merged = mergeDiscoveryContext(existing, {
      constraints: ["GDPR"],
      assumptions: ["Users have accounts"],
      successMeasures: ["metric two"],
    });
    expect(merged.readyForDrafting).toBe(true);
  });

  it("still resets readyForDrafting when patch mixes a genuinely new value with an existing one", () => {
    const existing = discoveryContextSchema.parse({
      goal: "Goal",
      actors: ["Finance manager"],
      successMeasures: ["metric"],
      readyForDrafting: true,
    });

    const merged = mergeDiscoveryContext(existing, { actors: ["Finance manager", "Billing operator"] });
    expect(merged.actors).toEqual(["Finance manager", "Billing operator"]);
    expect(merged.readyForDrafting).toBe(false);
  });
});

describe("computeDraftingReadinessState", () => {
  it("returns fields_incomplete when required fields are missing", () => {
    const ctx = discoveryContextSchema.parse({ goal: "Goal" });
    expect(computeDraftingReadinessState(ctx, 0)).toBe("fields_incomplete");
  });

  it("returns pending_confirmation when fields complete but not confirmed", () => {
    const ctx = discoveryContextSchema.parse({
      goal: "Goal",
      actors: ["admin"],
      successMeasures: ["metric"],
    });
    expect(computeDraftingReadinessState(ctx, 0)).toBe("pending_confirmation");
  });

  it("returns confirmed when fields complete and explicitly confirmed", () => {
    const ctx = discoveryContextSchema.parse({
      goal: "Goal",
      actors: ["admin"],
      successMeasures: ["metric"],
      readyForDrafting: true,
    });
    expect(computeDraftingReadinessState(ctx, 0)).toBe("confirmed");
  });

  it("returns pending_confirmation rather than confirmed when fields incomplete even if readyForDrafting is stale-true", () => {
    const ctx = discoveryContextSchema.parse({
      goal: "Goal",
      readyForDrafting: true,
    });
    expect(computeDraftingReadinessState(ctx, 0)).toBe("fields_incomplete");
  });
});

describe("isConfirmedReadyForDrafting", () => {
  it("returns false when not confirmed", () => {
    const ctx = discoveryContextSchema.parse({
      goal: "Goal",
      actors: ["admin"],
      successMeasures: ["metric"],
    });
    expect(isConfirmedReadyForDrafting(ctx, 0)).toBe(false);
  });

  it("returns true when fields complete and confirmed", () => {
    const ctx = discoveryContextSchema.parse({
      goal: "Goal",
      actors: ["admin"],
      successMeasures: ["metric"],
      readyForDrafting: true,
    });
    expect(isConfirmedReadyForDrafting(ctx, 0)).toBe(true);
  });
});
