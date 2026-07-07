import { describe, expect, it } from "bun:test";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { readDiscoveryContext, readDiscoveryQuestions, writeDiscoveryContext } from "@/store/discovery";
import { readTracker, writeTracker } from "@/store/tracker";
import { applyAuthoringMeta, checkDiscoveryReadiness, computeDraftingReadinessState } from "@/workflows/discovery";

/**
 * These tests exercise the same sequence of store/workflow calls that the
 * `discovery_confirm` tool performs, using real filesystem persistence in a
 * temp directory. This mirrors the tool's guard and confirmation behavior
 * without invoking the OpenCode tool wrapper directly.
 */

function countOpenQuestions(questionsText: string): number {
  return questionsText.split("\n").filter((line) => line.startsWith("- ")).length;
}

async function attemptConfirm(root: string): Promise<{ confirmed: boolean; state: string }> {
  const ctx = await readDiscoveryContext(root);
  const questionsText = await readDiscoveryQuestions(root);
  const openQuestionsCount = countOpenQuestions(questionsText);

  const readiness = checkDiscoveryReadiness(ctx, openQuestionsCount);
  if (!readiness.ready) {
    return { confirmed: false, state: computeDraftingReadinessState(ctx, openQuestionsCount) };
  }

  const confirmed = { ...ctx, readyForDrafting: true, updatedAt: new Date().toISOString() };
  await writeDiscoveryContext(root, confirmed);

  const tracker = await readTracker(root);
  const updated = applyAuthoringMeta(tracker, {
    discoveryReady: true,
    lastDiscoveryUpdate: new Date().toISOString(),
    pendingQuestionsCount: openQuestionsCount,
  });
  await writeTracker(root, updated);

  return { confirmed: true, state: computeDraftingReadinessState(confirmed, openQuestionsCount) };
}

describe("discovery_confirm behavior", () => {
  it("rejects confirmation when required fields are incomplete", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-prd-discovery-confirm-incomplete-"));

    await writeDiscoveryContext(root, {
      goal: "Build something",
      actors: [],
      constraints: [],
      assumptions: [],
      successMeasures: [],
      readyForDrafting: false,
      updatedAt: new Date().toISOString(),
    });

    const result = await attemptConfirm(root);
    expect(result.confirmed).toBe(false);
    expect(result.state).toBe("fields_incomplete");

    const persisted = await readDiscoveryContext(root);
    expect(persisted.readyForDrafting).toBe(false);
  });

  it("confirms discovery when required fields are complete", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-prd-discovery-confirm-complete-"));

    await writeDiscoveryContext(root, {
      goal: "Build a billing workspace",
      actors: ["Finance manager"],
      constraints: [],
      assumptions: [],
      successMeasures: ["Invoices processed within a day"],
      readyForDrafting: false,
      updatedAt: new Date().toISOString(),
    });

    const result = await attemptConfirm(root);
    expect(result.confirmed).toBe(true);
    expect(result.state).toBe("confirmed");

    const persisted = await readDiscoveryContext(root);
    expect(persisted.readyForDrafting).toBe(true);

    const tracker = await readTracker(root);
    expect(tracker.authoring.discoveryReady).toBe(true);
  });

  it("does not persist confirmation when rejected", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-prd-discovery-confirm-noop-"));

    await writeDiscoveryContext(root, {
      goal: "",
      actors: [],
      constraints: [],
      assumptions: [],
      successMeasures: [],
      readyForDrafting: false,
      updatedAt: new Date().toISOString(),
    });

    await attemptConfirm(root);

    const tracker = await readTracker(root);
    expect(tracker.authoring.discoveryReady).toBe(false);
  });
});
