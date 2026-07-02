import { describe, expect, it } from "bun:test";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { writeOpenSpecChange } from "@/adapters/openspec";
import { trackerSchema } from "@/schemas/tracker";
import { writeReview, writeReviewIndex, writeTracker } from "@/store";
import { FEATURE_STATUSES, TASK_STATUSES, WORKFLOW_STATES } from "@/utils/constants";
import { computeSyncResult, formatSyncResult, generateFeatureOpenSpecChange } from "@/workflows/openspec-sync";
import { writeFeaturePlan } from "@/workflows/planning";
import {
  canRegeneratePlan,
  describeReentryPath,
  formatReentryGuidance,
  routeRejectedReview,
  routeReplanRequired,
} from "@/workflows/recovery";
import { createApprovedReview } from "@/workflows/review";
import { scaffoldFeature } from "@/workflows/scaffold";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeTracker(overrides: Record<string, unknown> = {}) {
  return trackerSchema.parse({
    workflow: { state: WORKFLOW_STATES.featureReview, updatedAt: new Date().toISOString() },
    project: {},
    authoring: {},
    features: [],
    changeRequests: [],
    ...overrides,
  });
}

function makeFeature(
  id: string,
  status: string = FEATURE_STATUSES.implementationReady,
  tasks: Array<{ id: string; status: string }> = [],
) {
  return {
    id,
    slug: id.replace("feat-", ""),
    sequence: 1,
    title: id,
    status,
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

// ── Task 1.1-1.2: Rejected review re-entry ───────────────────────────────────

describe("routeRejectedReview", () => {
  it("routes feature back to inReview and workflow to featureReview", () => {
    const tracker = makeTracker({
      features: [makeFeature("feat-billing", FEATURE_STATUSES.awaitingConfirmation)],
    });

    const next = routeRejectedReview(tracker, "feat-billing");

    expect(next.features[0]?.status).toBe(FEATURE_STATUSES.inReview);
    expect(next.workflow.state).toBe(WORKFLOW_STATES.featureReview);
  });

  it("does not mutate the original tracker", () => {
    const tracker = makeTracker({
      features: [makeFeature("feat-billing", FEATURE_STATUSES.awaitingConfirmation)],
    });
    const originalState = tracker.workflow.state;

    routeRejectedReview(tracker, "feat-billing");

    expect(tracker.workflow.state).toBe(originalState);
    expect(tracker.features[0]?.status).toBe(FEATURE_STATUSES.awaitingConfirmation);
  });

  it("returns original tracker unchanged when featureId is unknown", () => {
    const tracker = makeTracker({ features: [makeFeature("feat-billing")] });
    const next = routeRejectedReview(tracker, "feat-unknown");

    expect(next.workflow.state).toBe(tracker.workflow.state);
    expect(next.features[0]?.status).toBe(FEATURE_STATUSES.implementationReady);
  });

  it("preserves other features when routing one back", () => {
    const tracker = makeTracker({
      features: [
        makeFeature("feat-a", FEATURE_STATUSES.awaitingConfirmation),
        makeFeature("feat-b", FEATURE_STATUSES.implementationReady),
      ],
    });

    const next = routeRejectedReview(tracker, "feat-a");

    expect(next.features[0]?.status).toBe(FEATURE_STATUSES.inReview);
    expect(next.features[1]?.status).toBe(FEATURE_STATUSES.implementationReady);
  });
});

// ── Task 1.3: Replan-required re-entry ───────────────────────────────────────

describe("routeReplanRequired", () => {
  it("routes feature to replanRequired and workflow to replanRequired", () => {
    const tracker = makeTracker({
      workflow: { state: WORKFLOW_STATES.implementationReady, updatedAt: new Date().toISOString() },
      features: [makeFeature("feat-checkout", FEATURE_STATUSES.implementationReady)],
    });

    const next = routeReplanRequired(tracker, "feat-checkout");

    expect(next.features[0]?.status).toBe(FEATURE_STATUSES.replanRequired);
    expect(next.workflow.state).toBe(WORKFLOW_STATES.replanRequired);
  });

  it("does not mutate original tracker", () => {
    const tracker = makeTracker({
      features: [makeFeature("feat-checkout", FEATURE_STATUSES.implementationReady)],
    });
    routeReplanRequired(tracker, "feat-checkout");
    expect(tracker.features[0]?.status).toBe(FEATURE_STATUSES.implementationReady);
  });

  it("preserves other features when routing one to replan", () => {
    const tracker = makeTracker({
      features: [
        makeFeature("feat-a", FEATURE_STATUSES.implementationReady),
        makeFeature("feat-b", FEATURE_STATUSES.implementationInProgress),
      ],
    });

    const next = routeReplanRequired(tracker, "feat-a");

    expect(next.features[0]?.status).toBe(FEATURE_STATUSES.replanRequired);
    expect(next.features[1]?.status).toBe(FEATURE_STATUSES.implementationInProgress);
  });
});

// ── Re-entry path descriptions ────────────────────────────────────────────────

describe("describeReentryPath", () => {
  it("returns rejectedReview path with correct states", () => {
    const info = describeReentryPath("rejectedReview");
    expect(info.featureState).toBe(FEATURE_STATUSES.inReview);
    expect(info.workflowState).toBe(WORKFLOW_STATES.featureReview);
    expect(info.preservedArtifacts.length).toBeGreaterThan(0);
    expect(info.revisitArtifacts).toContain("review.yaml");
  });

  it("returns replanRequired path with correct states", () => {
    const info = describeReentryPath("replanRequired");
    expect(info.featureState).toBe(FEATURE_STATUSES.replanRequired);
    expect(info.workflowState).toBe(WORKFLOW_STATES.replanRequired);
    expect(info.revisitArtifacts).toContain("05-plan.md");
  });
});

describe("formatReentryGuidance", () => {
  it("includes feature ID and scenario name in output", () => {
    const output = formatReentryGuidance("rejectedReview", "feat-billing");
    expect(output).toContain("feat-billing");
    expect(output).toContain("rejectedReview");
  });

  it("lists preserved artifacts", () => {
    const output = formatReentryGuidance("rejectedReview", "feat-billing");
    expect(output).toContain("01-foundation.md");
    expect(output).toContain("Preserved artifacts");
  });

  it("lists revisit artifacts", () => {
    const output = formatReentryGuidance("replanRequired", "feat-checkout");
    expect(output).toContain("05-plan.md");
    expect(output).toContain("Must revisit");
  });
});

// ── Task 2.2-2.3: canRegeneratePlan guard ────────────────────────────────────

describe("canRegeneratePlan", () => {
  it("allows regeneration for implementationReady feature", () => {
    const feature = makeFeature("feat-billing", FEATURE_STATUSES.implementationReady);
    const result = canRegeneratePlan(feature as Parameters<typeof canRegeneratePlan>[0]);
    expect(result.allowed).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it("allows regeneration for awaitingConfirmation feature", () => {
    const feature = makeFeature("feat-billing", FEATURE_STATUSES.awaitingConfirmation);
    const result = canRegeneratePlan(feature as Parameters<typeof canRegeneratePlan>[0]);
    expect(result.allowed).toBe(true);
  });

  it("blocks regeneration for implementationInProgress feature", () => {
    const feature = makeFeature("feat-billing", FEATURE_STATUSES.implementationInProgress, [
      { id: "BILL-1", status: TASK_STATUSES.inProgress },
    ]);
    const result = canRegeneratePlan(feature as Parameters<typeof canRegeneratePlan>[0]);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("already in progress");
    expect(result.reason).toContain("feat-billing");
  });

  it("blocks regeneration for done feature", () => {
    const feature = makeFeature("feat-billing", FEATURE_STATUSES.done);
    const result = canRegeneratePlan(feature as Parameters<typeof canRegeneratePlan>[0]);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("already complete");
  });

  it("includes started task count in reason for in-progress block", () => {
    const feature = makeFeature("feat-billing", FEATURE_STATUSES.implementationInProgress, [
      { id: "BILL-1", status: TASK_STATUSES.done },
      { id: "BILL-2", status: TASK_STATUSES.inProgress },
      { id: "BILL-3", status: TASK_STATUSES.pending },
    ]);
    const result = canRegeneratePlan(feature as Parameters<typeof canRegeneratePlan>[0]);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("2 task(s)");
  });
});

// ── Task 2.1: writeFeaturePlan is idempotent for same inputs ─────────────────

describe("writeFeaturePlan idempotence", () => {
  it("produces identical task structure on repeated calls with same steps", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-prd-rerun-plan-"));
    const feature = await scaffoldFeature(root, "Auth", 1);
    const trackerFeature = { ...feature, reviewPath: "", tasks: [] };
    const steps = ["Implement login", "Add JWT support"];

    const first = await writeFeaturePlan(root, trackerFeature, steps);
    const second = await writeFeaturePlan(root, trackerFeature, steps);

    expect(second).toHaveLength(first.length);
    expect(second[0]?.id).toBe(first[0]?.id);
    expect(second[0]?.title).toBe(first[0]?.title);
  });
});

// ── Task 2.1: OpenSpec generate is update-in-place ───────────────────────────

describe("generateFeatureOpenSpecChange idempotence", () => {
  it("returns isUpdate=true and same path on repeated generation", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-prd-rerun-openspec-"));
    const manifest = await scaffoldFeature(root, "Billing", 1);
    const feature = makeFeature(manifest.id, FEATURE_STATUSES.implementationReady, [
      { id: "BILL-1", status: TASK_STATUSES.pending },
    ]);

    const first = await generateFeatureOpenSpecChange(
      root,
      feature as Parameters<typeof generateFeatureOpenSpecChange>[1],
    );
    const second = await generateFeatureOpenSpecChange(
      root,
      feature as Parameters<typeof generateFeatureOpenSpecChange>[1],
    );

    expect(second.path).toBe(first.path);
    expect(second.isUpdate).toBe(true);
  });

  it("updates content without creating a duplicate file", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-prd-rerun-openspec-content-"));
    const manifest = await scaffoldFeature(root, "Reports", 1);
    const featureV1 = makeFeature(manifest.id, FEATURE_STATUSES.implementationReady, [
      { id: "RPT-1", status: TASK_STATUSES.pending },
    ]);
    const featureV2 = {
      ...featureV1,
      tasks: [{ ...featureV1.tasks[0]!, status: TASK_STATUSES.done }],
    };

    await generateFeatureOpenSpecChange(root, featureV1 as Parameters<typeof generateFeatureOpenSpecChange>[1]);
    const { path: artifactPath } = await generateFeatureOpenSpecChange(
      root,
      featureV2 as Parameters<typeof generateFeatureOpenSpecChange>[1],
    );

    const { readText } = await import("@/utils/fs");
    const content = await readText(artifactPath);
    expect(content).toContain("- [x] RPT-1");
  });
});

// ── Task 3.1-3.3: SyncOutcomeKind classification and repair guidance ──────────

describe("computeSyncResult outcomeKind", () => {
  it("returns no_op when no OpenSpec artifact exists", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-prd-sync-kind-noop-"));
    const feature = makeFeature("feat-new");
    const result = await computeSyncResult(root, feature as Parameters<typeof computeSyncResult>[1]);
    expect(result.outcomeKind).toBe("no_op");
    expect(result.repairGuidance).toHaveLength(0);
  });

  it("returns no_op when tracker and OpenSpec already agree", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-prd-sync-kind-agree-"));
    const feature = makeFeature("feat-checkout", FEATURE_STATUSES.implementationReady, [
      { id: "CHKOUT-1", status: TASK_STATUSES.done },
    ]);

    await writeOpenSpecChange(root, {
      ...feature,
      tasks: feature.tasks.map((t) => ({ ...t, status: TASK_STATUSES.done })),
    } as Parameters<typeof writeOpenSpecChange>[1]);

    const result = await computeSyncResult(root, feature as Parameters<typeof computeSyncResult>[1]);
    expect(result.noOp).toBe(true);
    expect(result.outcomeKind).toBe("no_op");
  });

  it("returns safe_update when OpenSpec is ahead of tracker", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-prd-sync-kind-update-"));
    const feature = makeFeature("feat-checkout", FEATURE_STATUSES.implementationReady, [
      { id: "CHKOUT-1", status: TASK_STATUSES.pending },
    ]);

    await writeOpenSpecChange(root, {
      ...feature,
      tasks: feature.tasks.map((t) => ({ ...t, status: TASK_STATUSES.done })),
    } as Parameters<typeof writeOpenSpecChange>[1]);

    const result = await computeSyncResult(root, feature as Parameters<typeof computeSyncResult>[1]);
    expect(result.outcomeKind).toBe("safe_update");
    expect(result.repairGuidance).toHaveLength(0);
  });

  it("returns conflict when tracker is ahead of OpenSpec", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-prd-sync-kind-conflict-"));
    const feature = makeFeature("feat-notify", FEATURE_STATUSES.implementationReady, [
      { id: "NOTIFY-1", status: TASK_STATUSES.done },
    ]);

    await writeOpenSpecChange(root, {
      ...feature,
      tasks: feature.tasks.map((t) => ({ ...t, status: TASK_STATUSES.pending })),
    } as Parameters<typeof writeOpenSpecChange>[1]);

    const result = await computeSyncResult(root, feature as Parameters<typeof computeSyncResult>[1]);
    expect(result.outcomeKind).toBe("conflict");
    expect(result.repairGuidance.length).toBeGreaterThan(0);
    expect(result.repairGuidance.some((line) => line.includes("feat-notify"))).toBe(true);
    expect(result.repairGuidance.some((line) => line.includes("NOTIFY-1"))).toBe(true);
  });

  it("returns manual_follow_up when safe updates and conflicts coexist", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-prd-sync-kind-mixed-"));
    const feature = makeFeature("feat-mixed", FEATURE_STATUSES.implementationReady, [
      { id: "MIX-1", status: TASK_STATUSES.pending },
      { id: "MIX-2", status: TASK_STATUSES.done },
    ]);

    // OpenSpec: MIX-1 done (ahead of tracker), MIX-2 pending (behind tracker)
    const mix1 = feature.tasks[0];
    const mix2 = feature.tasks[1];
    if (!mix1 || !mix2) throw new Error("Expected two tasks in manual_follow_up scenario");
    await writeOpenSpecChange(root, {
      ...feature,
      tasks: [
        { ...mix1, status: TASK_STATUSES.done },
        { ...mix2, status: TASK_STATUSES.pending },
      ],
    } as Parameters<typeof writeOpenSpecChange>[1]);

    const result = await computeSyncResult(root, feature as Parameters<typeof computeSyncResult>[1]);
    expect(result.outcomeKind).toBe("manual_follow_up");
    expect(result.updatedTaskIds).toContain("MIX-1");
    expect(result.conflicts.some((c) => c.taskId === "MIX-2")).toBe(true);
  });
});

describe("formatSyncResult with repair guidance", () => {
  it("includes outcomeKind label in output", () => {
    const result = {
      noOp: false,
      conflicts: [],
      updatedTaskIds: ["BILL-1"],
      outcomeKind: "safe_update" as const,
      repairGuidance: [],
    };
    const output = formatSyncResult(result, "feat-billing");
    expect(output).toContain("safe_update");
  });

  it("includes repair guidance for conflict outcome", () => {
    const result = {
      noOp: false,
      conflicts: [{ taskId: "BILL-1", trackerStatus: TASK_STATUSES.done, openSpecDone: false }],
      updatedTaskIds: [],
      outcomeKind: "conflict" as const,
      repairGuidance: [
        "1 task(s) are marked done in the tracker but still pending in the OpenSpec artifact.",
        "To reconcile, open openspec/changes/feat-billing.md and mark the following task(s) as done:",
        "  - [ ] → [x]  BILL-1",
        "Then rerun openspec_sync to confirm alignment.",
      ],
    };
    const output = formatSyncResult(result, "feat-billing");
    expect(output).toContain("Repair guidance");
    expect(output).toContain("BILL-1");
    expect(output).toContain("openspec_sync");
  });

  it("does not include repair guidance section for safe_update", () => {
    const result = {
      noOp: false,
      conflicts: [],
      updatedTaskIds: ["AUTH-1"],
      outcomeKind: "safe_update" as const,
      repairGuidance: [],
    };
    const output = formatSyncResult(result, "feat-auth");
    expect(output).not.toContain("Repair guidance");
  });
});

// ── Task 4.3: Full recovery cycle test ───────────────────────────────────────

describe("recovery cycle: review rejection then re-approval", () => {
  it("feature can advance after re-review following rejection", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-prd-recovery-cycle-"));
    const manifest = await scaffoldFeature(root, "Payments", 1);

    let tracker = makeTracker({
      workflow: { state: WORKFLOW_STATES.featureReview, updatedAt: new Date().toISOString() },
      features: [
        {
          ...manifest,
          status: FEATURE_STATUSES.awaitingConfirmation,
          reviewPath: `docs/features/${manifest.id}/review.yaml`,
          tasks: [],
        },
      ],
    });

    tracker = routeRejectedReview(tracker, manifest.id);
    expect(tracker.features[0]?.status).toBe(FEATURE_STATUSES.inReview);
    expect(tracker.workflow.state).toBe(WORKFLOW_STATES.featureReview);

    const feature = tracker.features[0];
    if (!feature) throw new Error("Feature missing");
    await writeReview(root, feature.reviewPath, createApprovedReview("Approved after revision."));
    await writeReviewIndex(root, feature.id, createApprovedReview("Approved after revision."));

    feature.status = FEATURE_STATUSES.awaitingConfirmation;
    tracker.workflow.state = WORKFLOW_STATES.awaitingUserConfirmation;
    tracker.workflow.updatedAt = new Date().toISOString();
    await writeTracker(root, tracker);

    const persisted = JSON.parse(JSON.stringify(tracker));
    expect(persisted.features[0].status).toBe(FEATURE_STATUSES.awaitingConfirmation);
    expect(persisted.workflow.state).toBe(WORKFLOW_STATES.awaitingUserConfirmation);
  });
});

describe("recovery cycle: replan-required with change request", () => {
  it("feature can be re-routed to replan and retains other feature state", () => {
    const tracker = makeTracker({
      workflow: { state: WORKFLOW_STATES.implementationReady, updatedAt: new Date().toISOString() },
      features: [
        makeFeature("feat-billing", FEATURE_STATUSES.implementationReady, [
          { id: "BILL-1", status: TASK_STATUSES.pending },
        ]),
        makeFeature("feat-reports", FEATURE_STATUSES.implementationInProgress, [
          { id: "RPT-1", status: TASK_STATUSES.inProgress },
        ]),
      ],
    });

    const next = routeReplanRequired(tracker, "feat-billing");

    expect(next.features[0]?.status).toBe(FEATURE_STATUSES.replanRequired);
    expect(next.features[1]?.status).toBe(FEATURE_STATUSES.implementationInProgress);
    expect(next.workflow.state).toBe(WORKFLOW_STATES.replanRequired);
  });
});
