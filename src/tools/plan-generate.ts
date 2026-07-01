import { tool } from "@opencode-ai/plugin";

import { readReview, readTracker, writeTracker } from "@/store";
import { FEATURE_STATUSES, WORKFLOW_STATES } from "@/utils/constants";
import { canGeneratePlan, writeFeaturePlan } from "@/workflows";

export const planGenerateTool = tool({
  description: "Generate a structured feature plan after review approval.",
  args: {
    featureId: tool.schema.string().min(1),
    steps: tool.schema.array(tool.schema.string().min(1)).min(1),
  },
  async execute(args, context) {
    const tracker = await readTracker(context.directory);
    const feature = tracker.features.find((item) => item.id === args.featureId);
    if (!feature) {
      throw new Error(`Unknown feature: ${args.featureId}`);
    }

    const review = await readReview(context.directory, feature.reviewPath);
    if (!canGeneratePlan(review)) {
      throw new Error(`Feature ${args.featureId} is not approved for planning.`);
    }

    feature.tasks = await writeFeaturePlan(context.directory, feature, args.steps);
    feature.status = FEATURE_STATUSES.implementationReady;
    tracker.workflow.state = WORKFLOW_STATES.implementationReady;
    tracker.workflow.updatedAt = new Date().toISOString();
    await writeTracker(context.directory, tracker);

    return {
      title: "Feature plan generated",
      output: `Generated ${feature.tasks.length} implementation tasks for ${feature.id}.`,
    };
  },
});
