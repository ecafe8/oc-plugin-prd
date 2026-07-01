import { describe, expect, it } from "bun:test";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathExists, readText } from "@/utils/fs";
import { scaffoldFeature, writeFeaturePlan } from "@/workflows";

describe("writeFeaturePlan", () => {
  it("writes a structured plan and returns tracker tasks", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-plugin-prd-plan-"));
    const feature = await scaffoldFeature(root, "Invoices", 1);
    const tasks = await writeFeaturePlan(root, { ...feature, reviewPath: "", tasks: [] }, [
      "Create invoice service",
      "Add invoice endpoint",
    ]);

    const planPath = path.join(root, "docs/features", feature.id, "05-plan.md");
    expect(await pathExists(planPath)).toBe(true);
    expect(tasks).toHaveLength(2);
    expect(await readText(planPath)).toContain("Create invoice service");
  });
});
