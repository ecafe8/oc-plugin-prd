import { describe, expect, it } from "bun:test";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { loadMergedConfig, writeWorkspaceConfig } from "@/store/config";
import { WORKSPACE_CONFIG_PATH } from "@/utils/constants";
import { pathExists, readText } from "@/utils/fs";
import { resolveWorkspacePath } from "@/utils/paths";

describe("writeWorkspaceConfig", () => {
  it("writes a config file with model settings", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-prd-switch-model-"));

    await writeWorkspaceConfig(root, {
      models: {
        drafting: { model: "claude-opus-4-5" },
        review: { model: "claude-sonnet-4-5" },
      },
    });

    expect(await pathExists(resolveWorkspacePath(root, WORKSPACE_CONFIG_PATH))).toBe(true);

    const content = await readText(resolveWorkspacePath(root, WORKSPACE_CONFIG_PATH));
    expect(content).toContain("drafting");
    expect(content).toContain("claude-opus-4-5");
    expect(content).toContain("review");
    expect(content).toContain("claude-sonnet-4-5");
  });

  it("round-trips through loadMergedConfig", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-prd-switch-model-rt-"));

    await writeWorkspaceConfig(root, {
      models: {
        drafting: { model: "qwen3.7-plus" },
      },
    });

    const loaded = await loadMergedConfig(root);
    expect(loaded.models.drafting?.model).toBe("qwen3.7-plus");
  });

  it("overwrites existing model on subsequent write", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-prd-switch-model-ow-"));

    await writeWorkspaceConfig(root, {
      models: {
        drafting: { model: "model-a" },
        review: { model: "model-b" },
      },
    });

    await writeWorkspaceConfig(root, {
      models: {
        drafting: { model: "model-c" },
        review: { model: "model-b" },
      },
    });

    const loaded = await loadMergedConfig(root);
    expect(loaded.models.drafting?.model).toBe("model-c");
    expect(loaded.models.review?.model).toBe("model-b");
  });

  it("preserves workflow settings when switching models", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-prd-switch-model-wf-"));

    await writeWorkspaceConfig(root, {
      models: { drafting: { model: "model-a" } },
      workflow: {
        autoSyncOpenSpec: false,
        configErrorSeverity: "warn",
      },
    });

    await writeWorkspaceConfig(root, {
      models: { drafting: { model: "model-b" } },
      workflow: {
        autoSyncOpenSpec: false,
        configErrorSeverity: "warn",
      },
    });

    const loaded = await loadMergedConfig(root);
    expect(loaded.models.drafting?.model).toBe("model-b");
    expect(loaded.workflow.autoSyncOpenSpec).toBe(false);
    expect(loaded.workflow.configErrorSeverity).toBe("warn");
  });
});
