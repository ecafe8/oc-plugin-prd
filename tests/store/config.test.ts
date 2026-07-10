import { describe, expect, it } from "bun:test";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { resolveModelForRole } from "@/adapters/model-selector";
import { loadMergedConfig } from "@/store";

describe("loadMergedConfig", () => {
  it("loads workspace config and preserves defaults", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-plugin-prd-config-"));
    await Bun.write(
      path.join(root, ".vibe/config.yaml"),
      [
        "models:",
        "  drafting:",
        "    model: github-copilot/gpt-5-mini",
        "workflow:",
        "  autoSyncOpenSpec: false",
        "",
      ].join("\n"),
    );

    const config = await loadMergedConfig(root);

    expect(config.models.drafting?.model).toBe("github-copilot/gpt-5-mini");
    expect(config.workflow.autoSyncOpenSpec).toBe(false);
    expect(config.workflow.configErrorSeverity).toBe("block");
    expect(config.workflow.review.maxIterations).toBe(3);
    expect(config.workflow.review.escalationAfter).toBe(2);
  });

  it("loads custom review iteration limits", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-plugin-prd-config-review-"));
    await Bun.write(
      path.join(root, ".vibe/config.yaml"),
      ["workflow:", "  review:", "    maxIterations: 5", "    escalationAfter: 3", ""].join("\n"),
    );

    const config = await loadMergedConfig(root);
    expect(config.workflow.review.maxIterations).toBe(5);
    expect(config.workflow.review.escalationAfter).toBe(3);
  });

  it("rejects review escalationAfter greater than maxIterations", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-plugin-prd-config-review-invalid-"));
    await Bun.write(
      path.join(root, ".vibe/config.yaml"),
      ["workflow:", "  review:", "    maxIterations: 2", "    escalationAfter: 3", ""].join("\n"),
    );

    await expect(loadMergedConfig(root)).rejects.toThrow("escalationAfter must not exceed maxIterations");
  });

  it("rejects zero, negative, and non-integer review limits", async () => {
    for (const [name, value] of [
      ["zero", "0"],
      ["negative", "-1"],
      ["non-integer", "1.5"],
    ]) {
      const root = await mkdtemp(path.join(os.tmpdir(), `oc-plugin-prd-config-review-${name}-`));
      await Bun.write(
        path.join(root, ".vibe/config.yaml"),
        ["workflow:", "  review:", `    maxIterations: ${value}`, "    escalationAfter: 1", ""].join("\n"),
      );

      await expect(loadMergedConfig(root)).rejects.toThrow();
    }
  });

  it("prefers workspace model settings over user config", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-plugin-prd-config-workspace-"));
    const home = await mkdtemp(path.join(os.tmpdir(), "oc-plugin-prd-home-"));
    const previousHome = process.env.HOME;
    process.env.HOME = home;

    try {
      await Bun.write(
        path.join(home, ".config/opencode/oc-plugin-prd.jsonc"),
        JSON.stringify({
          models: {
            drafting: { model: "github-copilot/gpt-5-mini" },
            review: { model: "github-copilot/gpt-5" },
          },
        }),
      );

      await Bun.write(
        path.join(root, ".vibe/config.yaml"),
        ["models:", "  drafting:", "    model: openai/gpt-4.1", ""].join("\n"),
      );

      const config = await loadMergedConfig(root);

      expect(config.models.drafting?.model).toBe("openai/gpt-4.1");
      expect(config.models.review?.model).toBe("github-copilot/gpt-5");
    } finally {
      process.env.HOME = previousHome;
    }
  });

  it("resolves model roles with fallback", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-plugin-prd-config-fallback-"));
    const config = await loadMergedConfig(root);

    expect(resolveModelForRole(config, "drafting", "github-copilot/gpt-5-mini")).toBe("github-copilot/gpt-5-mini");
  });
});
