import { describe, expect, it } from "bun:test";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { writeOpenSpecChange } from "@/adapters/openspec";
import { FEATURE_STATUSES, TASK_STATUSES } from "@/utils/constants";
import { pathExists, readText } from "@/utils/fs";
import { scaffoldFeature, writeFeaturePlan } from "@/workflows";

describe("writeOpenSpecChange", () => {
  it("creates an OpenSpec change artifact from feature tasks", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-plugin-prd-openspec-"));
    const feature = await scaffoldFeature(root, "Checkout", 1);
    const tasks = await writeFeaturePlan(root, { ...feature, reviewPath: "", tasks: [] }, ["Implement checkout"]);

    const { path: handoffPath } = await writeOpenSpecChange(root, {
      ...feature,
      status: FEATURE_STATUSES.implementationReady,
      reviewPath: "",
      tasks: tasks.map((t) => ({ ...t, status: TASK_STATUSES.pending })),
    });

    expect(await pathExists(handoffPath)).toBe(true);
    expect(await readText(handoffPath)).toContain("Implement checkout");
  });
});
