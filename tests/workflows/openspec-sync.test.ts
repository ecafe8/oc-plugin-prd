import { describe, expect, it } from "bun:test";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathExists, readText } from "@/utils/fs";
import { scaffoldFeature, writeFeaturePlan, writeOpenSpecHandoff } from "@/workflows";

describe("writeOpenSpecHandoff", () => {
  it("creates an OpenSpec handoff artifact from feature tasks", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-plugin-prd-openspec-"));
    const feature = await scaffoldFeature(root, "Checkout", 1);
    const tasks = await writeFeaturePlan(root, { ...feature, reviewPath: "", tasks: [] }, ["Implement checkout"]);
    const handoffPath = await writeOpenSpecHandoff(root, { ...feature, reviewPath: "", tasks });

    expect(await pathExists(handoffPath)).toBe(true);
    expect(await readText(handoffPath)).toContain("Implement checkout");
  });
});
