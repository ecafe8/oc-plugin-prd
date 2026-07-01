import { describe, expect, it } from "bun:test";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { FEATURE_FILE_NAMES } from "@/utils/constants";
import { pathExists } from "@/utils/fs";
import { scaffoldFeature } from "@/workflows";

describe("scaffoldFeature", () => {
  it("creates canonical feature files", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-plugin-prd-feature-"));
    const feature = await scaffoldFeature(root, "User Authentication", 1);
    const directory = path.join(root, "docs/features", feature.id);

    expect(feature.id).toBe("feat-user-authentication");
    expect(await pathExists(path.join(directory, FEATURE_FILE_NAMES.index))).toBe(true);
    expect(await pathExists(path.join(directory, FEATURE_FILE_NAMES.foundation))).toBe(true);
    expect(await pathExists(path.join(directory, FEATURE_FILE_NAMES.product))).toBe(true);
    expect(await pathExists(path.join(directory, FEATURE_FILE_NAMES.uiUx))).toBe(true);
    expect(await pathExists(path.join(directory, FEATURE_FILE_NAMES.technical))).toBe(true);
    expect(await pathExists(path.join(directory, FEATURE_FILE_NAMES.plan))).toBe(true);
    expect(await pathExists(path.join(directory, FEATURE_FILE_NAMES.review))).toBe(true);
  });
});
