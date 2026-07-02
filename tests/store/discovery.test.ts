import { describe, expect, it } from "bun:test";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { discoveryContextSchema } from "@/schemas/discovery";
import { ensureDiscoveryDir, readDiscoveryContext, writeDiscoveryContext } from "@/store/discovery";

describe("discovery store", () => {
  it("returns empty default when no context file exists", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-prd-discovery-"));
    const ctx = await readDiscoveryContext(root);
    expect(ctx.goal).toBe("");
    expect(ctx.actors).toEqual([]);
  });

  it("persists and restores discovery context", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-prd-discovery-persist-"));
    await ensureDiscoveryDir(root);

    const ctx = discoveryContextSchema.parse({
      goal: "Build a payment gateway",
      actors: ["merchant", "buyer"],
      successMeasures: ["payments processed"],
      updatedAt: new Date().toISOString(),
    });

    await writeDiscoveryContext(root, ctx);
    const restored = await readDiscoveryContext(root);

    expect(restored.goal).toBe("Build a payment gateway");
    expect(restored.actors).toEqual(["merchant", "buyer"]);
    expect(restored.successMeasures).toEqual(["payments processed"]);
  });
});
