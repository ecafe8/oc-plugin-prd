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
