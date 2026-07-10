import { tool } from "@opencode-ai/plugin";
import { loadMergedConfig, readReview, readTracker, writeReview, writeReviewIndex, writeTracker } from "@/store";
import { FEATURE_STATUSES, REVIEW_STATUSES, WORKFLOW_STATES } from "@/utils/constants";
import { createApprovedReview, createPendingReview } from "@/workflows";

export const featureReviewTool = tool({
  description: "Persist a structured feature review result and update workflow state.",
  args: {
    featureId: tool.schema.string().min(1),
    approved: tool.schema.boolean(),
    summary: tool.schema.string().default(""),
  },
  async execute(args, context) {
    const tracker = await readTracker(context.directory);
    const feature = tracker.features.find((item) => item.id === args.featureId);
    if (!feature) {
      throw new Error(`Unknown feature: ${args.featureId}`);
    }

    const config = await loadMergedConfig(context.directory);
    const limits = config.workflow.review;
    const review = args.approved
      ? createApprovedReview(args.summary, limits)
      : createPendingReview(args.summary, limits);
    await writeReview(context.directory, feature.reviewPath, review);
    await writeReviewIndex(context.directory, feature.id, review);

    feature.status = args.approved ? FEATURE_STATUSES.awaitingConfirmation : FEATURE_STATUSES.inReview;
    tracker.workflow.state = args.approved ? WORKFLOW_STATES.awaitingUserConfirmation : WORKFLOW_STATES.featureReview;
    tracker.workflow.updatedAt = new Date().toISOString();
    await writeTracker(context.directory, tracker);

    const refreshed = await readReview(context.directory, feature.reviewPath);
    return {
      title: "Feature review saved",
      output: `Review status: ${refreshed.decision.status}. Workflow now ${tracker.workflow.state}.`,
      metadata: {
        reviewStatus: args.approved ? REVIEW_STATUSES.approved : REVIEW_STATUSES.changesRequested,
      },
    };
  },
});
