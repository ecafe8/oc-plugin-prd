import { describe, expect, it } from "bun:test";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type { PluginInput } from "@opencode-ai/plugin";
import { createListModelsTool } from "@/tools/list-models";
import { createSwitchModelTool } from "@/tools/switch-model";

function makeToolContext(directory: string) {
  return {
    sessionID: "test-session",
    messageID: "test-message",
    agent: "build",
    directory,
    worktree: directory,
    abort: new AbortController().signal,
    metadata: () => {},
    ask: async () => {},
  };
}

const FAKE_PROVIDERS = [
  {
    id: "github-copilot",
    name: "GitHub Copilot",
    source: "config" as const,
    env: [],
    options: {},
    models: {
      "claude-sonnet-5": { id: "claude-sonnet-5" },
      "gpt-5.4": { id: "gpt-5.4" },
    },
  },
  {
    id: "bailian-token-plan",
    name: "Alibaba Cloud Model Studio",
    source: "config" as const,
    env: [],
    options: {},
    models: {
      "qwen3.7-plus": { id: "qwen3.7-plus" },
    },
  },
];

function makePluginInput(directory: string, providersResult: unknown): PluginInput {
  return {
    client: {
      config: {
        providers: async () => providersResult,
      },
    },
    project: {} as PluginInput["project"],
    directory,
    worktree: directory,
    experimental_workspace: { register: () => {} },
    serverUrl: new URL("http://localhost"),
    $: (() => {}) as unknown as PluginInput["$"],
  } as unknown as PluginInput;
}

describe("list_models", () => {
  it("lists all providers and models when no filter is given", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-prd-list-models-"));
    const ctx = makePluginInput(root, { data: { providers: FAKE_PROVIDERS, default: {} }, error: undefined });
    const listModelsTool = createListModelsTool(ctx);

    const result = await listModelsTool.execute({}, makeToolContext(root));
    const output = typeof result === "string" ? result : result.output;

    expect(output).toContain("github-copilot/claude-sonnet-5");
    expect(output).toContain("github-copilot/gpt-5.4");
    expect(output).toContain("bailian-token-plan/qwen3.7-plus");
  });

  it("filters to a single provider when requested", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-prd-list-models-filtered-"));
    const ctx = makePluginInput(root, { data: { providers: FAKE_PROVIDERS, default: {} }, error: undefined });
    const listModelsTool = createListModelsTool(ctx);

    const result = await listModelsTool.execute({ provider: "github-copilot" }, makeToolContext(root));
    const output = typeof result === "string" ? result : result.output;

    expect(output).toContain("github-copilot/claude-sonnet-5");
    expect(output).not.toContain("bailian-token-plan/qwen3.7-plus");
  });

  it("reports no matching providers for an unknown provider filter", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-prd-list-models-unknown-"));
    const ctx = makePluginInput(root, { data: { providers: FAKE_PROVIDERS, default: {} }, error: undefined });
    const listModelsTool = createListModelsTool(ctx);

    const result = await listModelsTool.execute({ provider: "does-not-exist" }, makeToolContext(root));
    const output = typeof result === "string" ? result : result.output;

    expect(output).toContain("No provider found");
  });

  it("handles a failed provider fetch gracefully", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-prd-list-models-error-"));
    const ctx = makePluginInput(root, { data: undefined, error: new Error("boom") });
    const listModelsTool = createListModelsTool(ctx);

    const result = await listModelsTool.execute({}, makeToolContext(root));
    const output = typeof result === "string" ? result : result.output;

    expect(output).toContain("Could not retrieve");
  });
});

describe("switch_model validation", () => {
  it("warns when the model is not found among available models", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-prd-switch-model-warn-"));
    const ctx = makePluginInput(root, { data: { providers: FAKE_PROVIDERS, default: {} }, error: undefined });
    const switchModelTool = createSwitchModelTool(ctx);

    const result = await switchModelTool.execute({ role: "review", model: "gpt-5-4" }, makeToolContext(root));
    const output = typeof result === "string" ? result : result.output;

    expect(output).toContain("⚠️");
    expect(output).toContain("not found among currently available models");
  });

  it("does not warn when the model exists in the available list", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-prd-switch-model-ok-"));
    const ctx = makePluginInput(root, { data: { providers: FAKE_PROVIDERS, default: {} }, error: undefined });
    const switchModelTool = createSwitchModelTool(ctx);

    const result = await switchModelTool.execute(
      { role: "review", model: "github-copilot/gpt-5.4" },
      makeToolContext(root),
    );
    const output = typeof result === "string" ? result : result.output;

    expect(output).not.toContain("⚠️");
  });

  it("still updates the config even when the model cannot be validated (fetch failure)", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-prd-switch-model-fetch-fail-"));
    const ctx = makePluginInput(root, { data: undefined, error: new Error("boom") });
    const switchModelTool = createSwitchModelTool(ctx);

    const result = await switchModelTool.execute({ role: "drafting", model: "anything/at-all" }, makeToolContext(root));
    const output = typeof result === "string" ? result : result.output;

    expect(output).toContain("anything/at-all");
    expect(output).not.toContain("⚠️");
  });
});
