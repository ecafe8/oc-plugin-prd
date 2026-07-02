import { describe, expect, it } from "bun:test";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { trackerSchema } from "@/schemas/tracker";
import {
  readTracker,
  writeDiscoveryContext,
  writeDiscoverySummary,
  writePendingCandidates,
  writeReview,
  writeReviewIndex,
  writeTracker,
} from "@/store";
import {
  CANDIDATES_PATH,
  DISCOVERY_CONTEXT_PATH,
  DISCOVERY_SUMMARY_PATH,
  FEATURE_FILE_NAMES,
  FEATURE_STATUSES,
  MASTER_PRD_PATH,
  REVIEWS_DIR,
  TASK_STATUSES,
  TRACKER_PATH,
  WORKFLOW_STATES,
} from "@/utils/constants";
import { pathExists, readText, writeText } from "@/utils/fs";
import { resolveWorkspacePath } from "@/utils/paths";
import { advanceToMasterPrdDrafting, advanceToMasterPrdReview } from "@/workflows/authoring";
import { materializeCandidate, normalizeCandidates, startFeatureSplitting } from "@/workflows/decomposition";
import { checkDiscoveryReadiness, formatDiscoverySummary } from "@/workflows/discovery";
import { applyOpenSpecSync, computeSyncResult, generateFeatureOpenSpecChange } from "@/workflows/openspec-sync";
import { writeFeaturePlan } from "@/workflows/planning";
import { aggregateProgress, syncOpenSpecStatus } from "@/workflows/progress";
import { createApprovedReview } from "@/workflows/review";

const MASTER_PRD_CONTENT = `# Master PRD

## Goals

- Give finance teams a shared billing workspace for invoice operations and reconciliation.

## Users

- Finance manager
- Billing operator

## Scope

- Track invoice processing work
- Reconcile payment exceptions

## Non-Goals

- Rebuild the external ERP system

## Dependencies / Constraints

- Must keep an auditable history of operator actions

## Success Measures

- Operators can resolve invoice exceptions in under one business day
`;

describe("dogfooding workflow", () => {
  it("validates a canonical multi-feature workflow with rerun-safe OpenSpec sync", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-plugin-prd-dogfooding-"));
    const timestamp = new Date().toISOString();

    const discoveryContext = {
      goal: "Create a billing workspace that helps finance teams manage invoice intake and reconciliation.",
      actors: ["Finance manager", "Billing operator"],
      constraints: ["Must preserve audit history", "Must support multi-step review of exceptions"],
      assumptions: ["Operators work feature-by-feature from a shared queue"],
      successMeasures: [
        "Invoice intake tasks are assigned consistently",
        "Reconciliation follow-up is visible across the team",
      ],
      readyForDrafting: true,
      updatedAt: timestamp,
    };

    const readiness = checkDiscoveryReadiness(discoveryContext, 0);
    expect(readiness.ready).toBe(true);

    await writeDiscoveryContext(root, discoveryContext);
    await writeDiscoverySummary(root, formatDiscoverySummary(discoveryContext));

    let tracker = await readTracker(root);
    tracker = trackerSchema.parse({
      ...tracker,
      project: {
        title: "Billing Workspace",
        summary: "Coordinate invoice intake and payment reconciliation for finance teams.",
      },
      authoring: {
        ...tracker.authoring,
        discoveryReady: true,
        lastDiscoveryUpdate: timestamp,
        pendingQuestionsCount: 0,
      },
    });
    await writeTracker(root, tracker);

    expect(await pathExists(resolveWorkspacePath(root, DISCOVERY_CONTEXT_PATH))).toBe(true);
    expect(await pathExists(resolveWorkspacePath(root, DISCOVERY_SUMMARY_PATH))).toBe(true);
    expect(await pathExists(resolveWorkspacePath(root, TRACKER_PATH))).toBe(true);
    expect(tracker.workflow.state).toBe(WORKFLOW_STATES.projectDiscovery);

    await writeText(resolveWorkspacePath(root, MASTER_PRD_PATH), MASTER_PRD_CONTENT);
    expect(await pathExists(resolveWorkspacePath(root, MASTER_PRD_PATH))).toBe(true);
    tracker = advanceToMasterPrdDrafting(tracker);
    await writeTracker(root, tracker);
    expect(tracker.workflow.state).toBe(WORKFLOW_STATES.masterPrdDrafting);

    tracker = advanceToMasterPrdReview(tracker);
    await writeTracker(root, tracker);
    expect(tracker.workflow.state).toBe(WORKFLOW_STATES.masterPrdReview);

    await writeReviewIndex(root, "master-prd", createApprovedReview("Master PRD approved for feature decomposition."));
    expect(await pathExists(resolveWorkspacePath(root, `${REVIEWS_DIR}/master-prd.yaml`))).toBe(true);
    tracker.workflow.state = WORKFLOW_STATES.featureSplitting;
    tracker.workflow.updatedAt = new Date().toISOString();
    await writeTracker(root, tracker);

    const candidates = normalizeCandidates([
      {
        title: "Invoice Intake",
        summary: "Capture invoice work items and route them into the finance queue.",
        priority: "high",
        sourceSections: ["Goals", "Scope"],
        rationale: "Teams need a reliable intake workflow before downstream reconciliation.",
      },
      {
        title: "Payment Reconciliation",
        summary: "Track exception handling for payments that do not reconcile cleanly.",
        priority: "medium",
        sourceSections: ["Scope", "Success Measures"],
        dependsOn: ["invoice-intake"],
        rationale: "Reconciliation depends on consistent invoice intake records.",
      },
    ]);

    await writePendingCandidates(root, {
      generatedAt: new Date().toISOString(),
      masterPrdApprovedAt: new Date().toISOString(),
      candidates,
    });
    expect(await pathExists(resolveWorkspacePath(root, CANDIDATES_PATH))).toBe(true);

    tracker = startFeatureSplitting(await readTracker(root));
    expect(tracker.workflow.state).toBe(WORKFLOW_STATES.featureSplitting);
    const manifests = [];
    for (const [index, candidate] of candidates.entries()) {
      manifests.push(await materializeCandidate(root, candidate, index + 1));
    }

    tracker.features = manifests.map((feature) => ({
      ...feature,
      reviewPath: `docs/features/${feature.id}/review.yaml`,
      tasks: [],
    }));
    await writeTracker(root, tracker);

    const [invoiceFeature, reconciliationFeature] = tracker.features;
    expect(invoiceFeature?.id).toBeTruthy();
    expect(reconciliationFeature?.id).toBeTruthy();
    expect(reconciliationFeature?.dependencies).toContain("invoice-intake");

    for (const feature of tracker.features) {
      const approvedReview = createApprovedReview(`${feature.title} approved for planning.`);
      await writeReview(root, feature.reviewPath, approvedReview);
      await writeReviewIndex(root, feature.id, approvedReview);
      feature.status = FEATURE_STATUSES.awaitingConfirmation;

      expect(await pathExists(resolveWorkspacePath(root, feature.reviewPath))).toBe(true);
      expect(
        await pathExists(resolveWorkspacePath(root, `docs/features/${feature.id}/${FEATURE_FILE_NAMES.index}`)),
      ).toBe(true);
      expect(
        await pathExists(resolveWorkspacePath(root, `docs/features/${feature.id}/${FEATURE_FILE_NAMES.foundation}`)),
      ).toBe(true);
      expect(
        await pathExists(resolveWorkspacePath(root, `docs/features/${feature.id}/${FEATURE_FILE_NAMES.product}`)),
      ).toBe(true);
      expect(
        await pathExists(resolveWorkspacePath(root, `docs/features/${feature.id}/${FEATURE_FILE_NAMES.technical}`)),
      ).toBe(true);
    }

    tracker.workflow.state = WORKFLOW_STATES.awaitingUserConfirmation;
    tracker.workflow.updatedAt = new Date().toISOString();
    await writeTracker(root, tracker);
    expect((await readTracker(root)).workflow.state).toBe(WORKFLOW_STATES.awaitingUserConfirmation);

    if (!invoiceFeature || !reconciliationFeature) {
      throw new Error("Expected materialized features for dogfooding scenario.");
    }

    invoiceFeature.tasks = await writeFeaturePlan(root, invoiceFeature, [
      "Create invoice intake queue",
      "Add operator assignment workflow",
    ]);
    invoiceFeature.status = FEATURE_STATUSES.implementationReady;

    reconciliationFeature.tasks = await writeFeaturePlan(root, reconciliationFeature, [
      "Create reconciliation exception tracker",
    ]);
    reconciliationFeature.status = FEATURE_STATUSES.implementationReady;

    tracker.workflow.state = WORKFLOW_STATES.implementationReady;
    tracker.workflow.updatedAt = new Date().toISOString();
    await writeTracker(root, tracker);

    const invoicePlan = await readText(
      resolveWorkspacePath(root, `docs/features/${invoiceFeature.id}/${FEATURE_FILE_NAMES.plan}`),
    );
    const reconciliationPlan = await readText(
      resolveWorkspacePath(root, `docs/features/${reconciliationFeature.id}/${FEATURE_FILE_NAMES.plan}`),
    );
    expect(invoicePlan).toContain("Create invoice intake queue");
    expect(reconciliationPlan).toContain("Create reconciliation exception tracker");

    const invoiceOpenSpec = await generateFeatureOpenSpecChange(root, invoiceFeature);
    const reconciliationOpenSpec = await generateFeatureOpenSpecChange(root, reconciliationFeature);
    expect(await pathExists(invoiceOpenSpec.path)).toBe(true);
    expect(await pathExists(reconciliationOpenSpec.path)).toBe(true);

    const rerun = await generateFeatureOpenSpecChange(root, invoiceFeature);
    expect(rerun.path).toBe(invoiceOpenSpec.path);
    expect(rerun.isUpdate).toBe(true);

    await generateFeatureOpenSpecChange(root, {
      ...invoiceFeature,
      tasks: invoiceFeature.tasks.map((task) => ({ ...task, status: TASK_STATUSES.done })),
    });

    const syncResult = await computeSyncResult(root, invoiceFeature);
    expect(syncResult.noOp).toBe(false);
    expect(syncResult.updatedTaskIds).toHaveLength(invoiceFeature.tasks.length);

    tracker = applyOpenSpecSync(tracker, invoiceFeature.id, syncResult.updatedTaskIds);
    tracker = syncOpenSpecStatus(tracker, invoiceFeature.id);
    await writeTracker(root, tracker);

    const syncedInvoiceFeature = tracker.features.find((feature) => feature.id === invoiceFeature.id);
    expect(syncedInvoiceFeature).toBeDefined();
    expect(syncedInvoiceFeature?.status).toBe(FEATURE_STATUSES.done);
    expect(tracker.workflow.state).toBe(WORKFLOW_STATES.implementationReady);

    const noOpResult = await computeSyncResult(root, syncedInvoiceFeature!);
    expect(noOpResult.noOp).toBe(true);
    expect(noOpResult.updatedTaskIds).toHaveLength(0);
    expect(noOpResult.conflicts).toHaveLength(0);

    const invoiceOpenSpecContent = await readText(invoiceOpenSpec.path);
    expect(invoiceOpenSpecContent).toContain(invoiceFeature.id);
    expect(invoiceOpenSpecContent).toContain(invoiceFeature.tasks[0]?.id ?? "");
    expect(await pathExists(reconciliationOpenSpec.path)).toBe(true);

    const progress = aggregateProgress(tracker);
    expect(progress.workflowState).toBe(WORKFLOW_STATES.implementationReady);
    expect(progress.features.total).toBe(2);
    expect(progress.features.done).toBe(1);
    expect(progress.features.pending).toBe(1);
    expect(progress.tasks.total).toBe(3);
    expect(progress.tasks.done).toBe(2);
    expect(progress.tasks.pending).toBe(1);

    const persistedTracker = await readTracker(root);
    expect(persistedTracker.features).toHaveLength(2);
    expect(persistedTracker.features.find((feature) => feature.id === invoiceFeature.id)?.status).toBe(
      FEATURE_STATUSES.done,
    );
    expect(persistedTracker.features.find((feature) => feature.id === reconciliationFeature.id)?.status).toBe(
      FEATURE_STATUSES.implementationReady,
    );
  });
});
