import { describe, expect, it } from "bun:test";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { buildOpenSpecChangeContent, parseOpenSpecTaskStatus, writeOpenSpecChange } from "@/adapters/openspec";
import { featureCandidateSchema } from "@/schemas/candidate";
import { trackerSchema } from "@/schemas/tracker";
import { FEATURE_STATUSES, TASK_STATUSES, WORKFLOW_STATES } from "@/utils/constants";
import { pathExists } from "@/utils/fs";
import { materializeCandidate } from "@/workflows/decomposition";
import { applyOpenSpecSync, computeSyncResult, formatSyncResult } from "@/workflows/openspec-sync";
import { aggregateProgress, formatAggregatedProgress } from "@/workflows/progress";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeTracker(overrides: Record<string, unknown> = {}) {
  return trackerSchema.parse({
    workflow: { state: WORKFLOW_STATES.implementationInProgress, updatedAt: new Date().toISOString() },
    project: {},
    authoring: {},
    features: [],
    changeRequests: [],
    ...overrides,
  });
}

function makeFeature(id: string, tasks: Array<{ id: string; status: string }> = []) {
  return {
    id,
    slug: id.replace("feat-", ""),
    sequence: 1,
    title: id,
    status: FEATURE_STATUSES.implementationReady,
    docs: {},
    dependencies: [],
    blockers: [],
    reviewPath: `docs/features/${id}/review.yaml`,
    tasks: tasks.map((t) => ({
      ...t,
      title: `Task ${t.id}`,
      dependsOn: [],
      targets: [],
      verification: [],
    })),
  };
}

// ── Task 3.2: OpenSpec artifact generation and update-in-place ────────────────

describe("buildOpenSpecChangeContent", () => {
  it("includes feature identity in output", () => {
    const feature = makeFeature("feat-billing", [{ id: "BILL-1", status: TASK_STATUSES.pending }]);
    const content = buildOpenSpecChangeContent(
      feature as Parameters<typeof buildOpenSpecChangeContent>[0],
      new Date().toISOString(),
    );
    expect(content).toContain("feat-billing");
    expect(content).toContain("BILL-1");
  });

  it("marks completed tasks with [x]", () => {
    const feature = makeFeature("feat-auth", [
      { id: "AUTH-1", status: TASK_STATUSES.done },
      { id: "AUTH-2", status: TASK_STATUSES.pending },
    ]);
    const content = buildOpenSpecChangeContent(
      feature as Parameters<typeof buildOpenSpecChangeContent>[0],
      new Date().toISOString(),
    );
    expect(content).toContain("- [x] AUTH-1");
    expect(content).toContain("- [ ] AUTH-2");
  });
});

describe("writeOpenSpecChange", () => {
  it("creates artifact file when it does not exist", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-prd-openspec-gen-"));
    const candidate = featureCandidateSchema.parse({ title: "Billing", slug: "billing" });
    const manifest = await materializeCandidate(root, candidate, 1);
    const feature = makeFeature(manifest.id);

    const { path: artifactPath, isUpdate } = await writeOpenSpecChange(
      root,
      feature as Parameters<typeof writeOpenSpecChange>[1],
    );

    expect(await pathExists(artifactPath)).toBe(true);
    expect(isUpdate).toBe(false);
  });

  it("returns isUpdate=true when artifact already exists", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-prd-openspec-update-"));
    const candidate = featureCandidateSchema.parse({ title: "Reports", slug: "reports" });
    const manifest = await materializeCandidate(root, candidate, 1);
    const feature = makeFeature(manifest.id);

    // First write
    await writeOpenSpecChange(root, feature as Parameters<typeof writeOpenSpecChange>[1]);
    // Second write (update)
    const { isUpdate } = await writeOpenSpecChange(root, feature as Parameters<typeof writeOpenSpecChange>[1]);
    expect(isUpdate).toBe(true);
  });
});

// ── Task 3.3: sync no-op detection and conflict reporting ─────────────────────

describe("parseOpenSpecTaskStatus", () => {
  it("parses done and pending task markers", () => {
    const content = ["- [x] AUTH-1 Implement JWT", "- [ ] AUTH-2 Add refresh tokens"].join("\n");
    const status = parseOpenSpecTaskStatus(content);
    expect(status.get("AUTH-1")).toBe(true);
    expect(status.get("AUTH-2")).toBe(false);
  });

  it("returns empty map for empty content", () => {
    expect(parseOpenSpecTaskStatus("").size).toBe(0);
  });
});

describe("computeSyncResult", () => {
  it("returns noOp when no OpenSpec artifact exists", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-prd-sync-noop-"));
    const feature = makeFeature("feat-new");
    const result = await computeSyncResult(root, feature as Parameters<typeof computeSyncResult>[1]);
    expect(result.noOp).toBe(true);
  });

  it("detects tasks to update when OpenSpec says done but tracker says pending", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-prd-sync-update-"));
    const feature = makeFeature("feat-checkout", [{ id: "CHKOUT-1", status: TASK_STATUSES.pending }]);

    // Write OpenSpec file that marks task as done
    await writeOpenSpecChange(root, {
      ...feature,
      tasks: feature.tasks.map((t) => ({ ...t, status: TASK_STATUSES.done })),
    } as Parameters<typeof writeOpenSpecChange>[1]);

    const result = await computeSyncResult(root, feature as Parameters<typeof computeSyncResult>[1]);
    expect(result.noOp).toBe(false);
    expect(result.updatedTaskIds).toContain("CHKOUT-1");
  });

  it("reports conflict when tracker says done but OpenSpec says pending", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-prd-sync-conflict-"));
    const feature = makeFeature("feat-notify", [{ id: "NOTIFY-1", status: TASK_STATUSES.done }]);

    // Write OpenSpec with task as pending (not done)
    await writeOpenSpecChange(root, {
      ...feature,
      tasks: feature.tasks.map((t) => ({ ...t, status: TASK_STATUSES.pending })),
    } as Parameters<typeof writeOpenSpecChange>[1]);

    const result = await computeSyncResult(root, feature as Parameters<typeof computeSyncResult>[1]);
    expect(result.conflicts.some((c) => c.taskId === "NOTIFY-1")).toBe(true);
  });
});

describe("applyOpenSpecSync", () => {
  it("marks specified tasks as done in tracker copy", () => {
    const tracker = makeTracker({
      features: [makeFeature("feat-auth", [{ id: "AUTH-1", status: TASK_STATUSES.pending }])],
    });
    const updated = applyOpenSpecSync(tracker, "feat-auth", ["AUTH-1"]);
    const task = updated.features[0]?.tasks[0];
    expect(task?.status).toBe(TASK_STATUSES.done);
  });

  it("returns original tracker when updatedTaskIds is empty (no-op)", () => {
    const tracker = makeTracker({ features: [makeFeature("feat-auth")] });
    const result = applyOpenSpecSync(tracker, "feat-auth", []);
    expect(result).toBe(tracker);
  });
});

describe("formatSyncResult", () => {
  it("includes no-op message when nothing changed", () => {
    const output = formatSyncResult(
      { noOp: true, conflicts: [], updatedTaskIds: [], outcomeKind: "no_op", repairGuidance: [] },
      "feat-auth",
    );
    expect(output).toContain("no changes required");
  });

  it("lists updated task ids when tasks were synced", () => {
    const output = formatSyncResult(
      {
        noOp: false,
        conflicts: [],
        updatedTaskIds: ["AUTH-1", "AUTH-2"],
        outcomeKind: "safe_update",
        repairGuidance: [],
      },
      "feat-auth",
    );
    expect(output).toContain("AUTH-1");
    expect(output).toContain("AUTH-2");
  });
});

// ── Task 3.4: aggregate progress with blockers and replan-required ────────────

describe("aggregateProgress", () => {
  it("counts done, active, pending, and replan-required features", () => {
    const tracker = makeTracker({
      features: [
        makeFeature("feat-a"),
        { ...makeFeature("feat-b"), status: FEATURE_STATUSES.done },
        { ...makeFeature("feat-c"), status: FEATURE_STATUSES.implementationInProgress },
        { ...makeFeature("feat-d"), status: FEATURE_STATUSES.replanRequired },
      ],
    });
    const progress = aggregateProgress(tracker);
    expect(progress.features.total).toBe(4);
    expect(progress.features.done).toBe(1);
    expect(progress.features.active).toBe(1);
    expect(progress.features.replanRequired).toBe(1);
    expect(progress.hasReplanRequired).toBe(true);
  });

  it("counts active change requests", () => {
    const tracker = trackerSchema.parse({
      workflow: {
        state: WORKFLOW_STATES.changeRequestReceived,
        updatedAt: new Date().toISOString(),
        activeChangeRequestId: "change-001-scope",
      },
      project: {},
      authoring: {},
      features: [],
      changeRequests: [
        {
          id: "change-001-scope",
          sequence: 1,
          slug: "scope",
          title: "Adjust scope",
          createdAt: new Date().toISOString(),
          impactedFeatures: [],
          impactedStates: [],
        },
      ],
    });
    const progress = aggregateProgress(tracker);
    expect(progress.changeRequests.total).toBe(1);
    expect(progress.changeRequests.active).toBe(1);
  });

  it("includes change request section in formatted output", () => {
    const tracker = trackerSchema.parse({
      workflow: {
        state: WORKFLOW_STATES.changeRequestReceived,
        updatedAt: new Date().toISOString(),
        activeChangeRequestId: "cr-1",
      },
      project: {},
      authoring: {},
      features: [],
      changeRequests: [
        {
          id: "cr-1",
          sequence: 1,
          slug: "scope",
          title: "Scope change",
          createdAt: new Date().toISOString(),
          impactedFeatures: [],
          impactedStates: [],
        },
      ],
    });
    const formatted = formatAggregatedProgress(aggregateProgress(tracker));
    expect(formatted).toContain("Change Requests");
  });

  it("includes replan warning in formatted output", () => {
    const tracker = makeTracker({
      features: [{ ...makeFeature("feat-x"), status: FEATURE_STATUSES.replanRequired }],
    });
    const formatted = formatAggregatedProgress(aggregateProgress(tracker));
    expect(formatted).toContain("replan_required");
  });
});
