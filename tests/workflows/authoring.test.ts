import { describe, expect, it } from "bun:test";
import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { resolveModelWithSource } from "@/adapters/model-selector";
import { vibeConfigSchema } from "@/schemas/config";
import { discoveryContextSchema } from "@/schemas/discovery";
import { trackerSchema } from "@/schemas/tracker";
import { MASTER_PRD_PATH, WORKFLOW_STATES } from "@/utils/constants";
import {
  advanceToMasterPrdDrafting,
  advanceToMasterPrdReview,
  assembleAuthoringContext,
  routeBackToDrafting,
} from "@/workflows/authoring";

function makeTracker(state: string) {
  return trackerSchema.parse({
    workflow: { state, updatedAt: new Date().toISOString() },
    project: {},
    authoring: {},
    features: [],
    changeRequests: [],
  });
}

describe("authoring workflow transitions", () => {
  it("advances to master_prd_drafting and marks discovery ready", () => {
    const tracker = makeTracker(WORKFLOW_STATES.projectDiscovery);
    const next = advanceToMasterPrdDrafting(tracker);
    expect(next.workflow.state).toBe(WORKFLOW_STATES.masterPrdDrafting);
    expect(next.authoring.discoveryReady).toBe(true);
  });

  it("advances to master_prd_review and records draft timestamp", () => {
    const tracker = makeTracker(WORKFLOW_STATES.masterPrdDrafting);
    const next = advanceToMasterPrdReview(tracker);
    expect(next.workflow.state).toBe(WORKFLOW_STATES.masterPrdReview);
    expect(next.authoring.lastMasterPrdDraft).toBeTruthy();
  });

  it("routes back to master_prd_drafting from review", () => {
    const tracker = makeTracker(WORKFLOW_STATES.masterPrdReview);
    const next = routeBackToDrafting(tracker);
    expect(next.workflow.state).toBe(WORKFLOW_STATES.masterPrdDrafting);
  });
});

describe("assembleAuthoringContext", () => {
  it("includes existing draft when master PRD file is present", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-prd-authoring-"));
    const docDir = path.join(root, "docs");
    await import("node:fs/promises").then((fs) => fs.mkdir(docDir, { recursive: true }));
    await writeFile(path.join(root, MASTER_PRD_PATH), "# Existing draft");

    const tracker = makeTracker(WORKFLOW_STATES.masterPrdDrafting);
    const ctx = discoveryContextSchema.parse({ goal: "Build auth", actors: ["user"], successMeasures: ["login"] });
    const config = vibeConfigSchema.parse({});

    const result = await assembleAuthoringContext(root, tracker, ctx, "summary", config);
    expect(result.existingDraft).toContain("Existing draft");
  });

  it("returns null for existingDraft when no master PRD exists", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-prd-authoring-empty-"));
    const tracker = makeTracker(WORKFLOW_STATES.masterPrdDrafting);
    const ctx = discoveryContextSchema.parse({});
    const config = vibeConfigSchema.parse({});

    const result = await assembleAuthoringContext(root, tracker, ctx, "", config);
    expect(result.existingDraft).toBeNull();
  });
});

describe("resolveModelWithSource", () => {
  it("returns configured when drafting model is set", () => {
    const config = vibeConfigSchema.parse({
      models: { drafting: { model: "openai/gpt-4.1" } },
    });
    const result = resolveModelWithSource(config, "drafting");
    expect(result.source).toBe("configured");
    expect(result.model).toBe("openai/gpt-4.1");
  });

  it("returns opencode-default when no model is configured", () => {
    const config = vibeConfigSchema.parse({});
    const result = resolveModelWithSource(config, "drafting");
    expect(result.source).toBe("opencode-default");
    expect(result.model).toBeUndefined();
  });

  it("returns fallback when explicit fallback is given but no config", () => {
    const config = vibeConfigSchema.parse({});
    const result = resolveModelWithSource(config, "drafting", "github-copilot/gpt-5-mini");
    expect(result.source).toBe("fallback");
    expect(result.model).toBe("github-copilot/gpt-5-mini");
  });
});
