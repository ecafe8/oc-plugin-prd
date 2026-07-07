import { describe, expect, it } from "bun:test";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { readTracker, writeTracker } from "@/store/tracker";
import { masterPrdGenerateTool } from "@/tools/master-prd-generate";
import { MASTER_PRD_PATH, WORKFLOW_STATES } from "@/utils/constants";
import { pathExists } from "@/utils/fs";
import { resolveWorkspacePath } from "@/utils/paths";

function makeContext(directory: string) {
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

describe("master_prd_generate confirmation gate", () => {
  it("blocks scaffolding when discovery is not confirmed ready", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-prd-master-prd-generate-blocked-"));

    const tracker = await readTracker(root);
    tracker.authoring.discoveryReady = false;
    await writeTracker(root, tracker);

    const result = await masterPrdGenerateTool.execute({}, makeContext(root));
    const output = typeof result === "string" ? result : result.output;
    expect(output).toContain("discovery_confirm");

    expect(await pathExists(resolveWorkspacePath(root, MASTER_PRD_PATH))).toBe(false);

    const persisted = await readTracker(root);
    expect(persisted.workflow.state).not.toBe(WORKFLOW_STATES.masterPrdDrafting);
  });

  it("proceeds and advances workflow when discovery is confirmed ready", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-prd-master-prd-generate-allowed-"));

    const tracker = await readTracker(root);
    tracker.authoring.discoveryReady = true;
    await writeTracker(root, tracker);

    const result = await masterPrdGenerateTool.execute({}, makeContext(root));
    const output = typeof result === "string" ? result : result.output;
    expect(output).toContain("Created");

    expect(await pathExists(resolveWorkspacePath(root, MASTER_PRD_PATH))).toBe(true);

    const persisted = await readTracker(root);
    expect(persisted.workflow.state).toBe(WORKFLOW_STATES.masterPrdDrafting);
  });
});
