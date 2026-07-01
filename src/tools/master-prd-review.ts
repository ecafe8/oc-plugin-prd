import { tool } from "@opencode-ai/plugin";

import { readTracker, writeReviewIndex, writeTracker } from "@/store";
import { REVIEW_STATUSES, WORKFLOW_STATES } from "@/utils/constants";
import { createApprovedReview, createPendingReview } from "@/workflows";

export const masterPrdReviewTool = tool({
  description: "Persist a structured review result for the master PRD.",
  args: {
    approved: tool.schema.boolean(),
    summary: tool.schema.string().default(""),
  },
  async execute(args, context) {
    const review = args.approved ? createApprovedReview(args.summary) : createPendingReview(args.summary);
    await writeReviewIndex(context.directory, "master-prd", review);

    const tracker = await readTracker(context.directory);
    tracker.workflow.state = args.approved ? WORKFLOW_STATES.featureSplitting : WORKFLOW_STATES.masterPrdDrafting;
    tracker.workflow.updatedAt = new Date().toISOString();
    await writeTracker(context.directory, tracker);

    return {
      title: "Master PRD review saved",
      output: `Master PRD review status: ${args.approved ? REVIEW_STATUSES.approved : REVIEW_STATUSES.changesRequested}.`,
    };
  },
});
