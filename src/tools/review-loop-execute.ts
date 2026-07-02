import { tool } from "@opencode-ai/plugin";
import { resolveModelWithSource } from "@/adapters/model-selector";
import { reviewRecordSchema } from "@/schemas/review";
import { loadMergedConfig } from "@/store/config";
import { readReview, writeReview, writeReviewIndex } from "@/store/review";
import { readTracker, writeTracker } from "@/store/tracker";
import { FEATURE_STATUSES, REVIEW_STATUSES, WORKFLOW_STATES } from "@/utils/constants";
import {
  appendIteration,
  checkEscalationNeeded,
  createReviewIteration,
  escalateReview,
  formatReviewSummary,
  markContradiction,
} from "@/workflows/review-loop";

export const reviewLoopExecuteTool = tool({
  description:
    "Record a review decision as a new iteration, handle escalation, and update workflow state. Call after review_loop_context and after completing the critique.",
  args: {
    artifactType: tool.schema.enum(["master_prd", "feature", "plan"]),
    reviewPath: tool.schema.string().min(1),
    featureId: tool.schema.string().optional(),
    approved: tool.schema.boolean(),
    summary: tool.schema.string().default(""),
    blockers: tool.schema.array(tool.schema.string()).default([]),
    warnings: tool.schema.array(tool.schema.string()).default([]),
    hasContradiction: tool.schema.boolean().default(false),
    contradictionDetails: tool.schema.string().optional(),
  },
  async execute(args, context) {
    const config = await loadMergedConfig(context.directory);
    const resolved = resolveModelWithSource(config, "review");

    // Load or create review record
    let record = await readReview(context.directory, args.reviewPath).catch(() =>
      reviewRecordSchema.parse({
        decision: { status: "not_reviewed", updatedAt: new Date().toISOString() },
      }),
    );

    // Handle contradiction first — blocks regardless of approved flag
    if (args.hasContradiction && args.contradictionDetails) {
      record = markContradiction(record, args.contradictionDetails);
      await writeReview(context.directory, args.reviewPath, record);
      if (args.featureId) await writeReviewIndex(context.directory, args.featureId, record);
      return {
        title: "Review blocked — contradiction detected",
        output: `Contradiction: ${args.contradictionDetails}\n${formatReviewSummary(record)}`,
        metadata: { status: REVIEW_STATUSES.blocked, escalated: false, contradiction: true },
      };
    }

    // Create and append new iteration
    const status = args.approved ? REVIEW_STATUSES.approved : REVIEW_STATUSES.changesRequested;
    const iteration = createReviewIteration(record, status, args.summary, args.blockers, args.warnings, resolved.model);
    record = appendIteration(record, iteration);

    // Update quality gates in record based on blockers/warnings
    for (const blocker of args.blockers) {
      const key = blocker.toLowerCase().replace(/\s+/g, "_").slice(0, 40);
      record.qualityGates[key] = "fail";
    }
    for (const warning of args.warnings) {
      const key = warning.toLowerCase().replace(/\s+/g, "_").slice(0, 40);
      if (!record.qualityGates[key]) {
        record.qualityGates[key] = "warning";
      }
    }

    // Check escalation (only on failure)
    if (!args.approved && checkEscalationNeeded(record)) {
      record = escalateReview(record, `Exceeded retry threshold (${record.loopState.retryThreshold}) without approval`);
    }

    await writeReview(context.directory, args.reviewPath, record);
    if (args.featureId) await writeReviewIndex(context.directory, args.featureId, record);

    // Update tracker workflow state
    const tracker = await readTracker(context.directory);

    if (args.artifactType === "master_prd") {
      tracker.workflow.state = args.approved ? WORKFLOW_STATES.featureSplitting : WORKFLOW_STATES.masterPrdDrafting;
      tracker.workflow.updatedAt = new Date().toISOString();
    } else if (args.artifactType === "feature" && args.featureId) {
      const feature = tracker.features.find((f) => f.id === args.featureId);
      if (feature) {
        feature.status = args.approved ? FEATURE_STATUSES.awaitingConfirmation : FEATURE_STATUSES.inReview;
        tracker.workflow.state = args.approved
          ? WORKFLOW_STATES.awaitingUserConfirmation
          : WORKFLOW_STATES.featureReview;
        tracker.workflow.updatedAt = new Date().toISOString();
      }
    }

    if (record.loopState.escalated) {
      tracker.workflow.state = WORKFLOW_STATES.replanRequired;
      tracker.workflow.updatedAt = new Date().toISOString();
    }

    await writeTracker(context.directory, tracker);

    return {
      title: `Review iteration ${iteration.iteration} recorded`,
      output: formatReviewSummary(record),
      metadata: {
        iteration: iteration.iteration,
        status: record.decision.status,
        escalated: record.loopState.escalated,
        retryCount: record.loopState.retryCount,
        reviewModel: resolved.model,
        modelSource: resolved.source,
      },
    };
  },
});
