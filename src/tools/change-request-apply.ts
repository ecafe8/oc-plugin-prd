import { tool } from "@opencode-ai/plugin";

import { createChangeRequest, readTracker, writeTracker } from "@/store";
import { WORKFLOW_STATES } from "@/utils/constants";
import { toKebabCase } from "@/utils/paths";

export const changeRequestApplyTool = tool({
  description: "Record a change request and move workflow into replanning.",
  args: {
    title: tool.schema.string().min(1),
    request: tool.schema.string().min(1),
    impactedFeatures: tool.schema.array(tool.schema.string()).default([]),
  },
  async execute(args, context) {
    const tracker = await readTracker(context.directory);
    const sequence = tracker.changeRequests.length + 1;
    const slug = toKebabCase(args.title);

    await createChangeRequest(
      context.directory,
      {
        id: `${slug}-${sequence}`,
        sequence,
        slug,
        title: args.title,
        createdAt: new Date().toISOString(),
        impactedFeatures: args.impactedFeatures,
        impactedStates: [WORKFLOW_STATES.changeRequestReceived, WORKFLOW_STATES.replanRequired],
      },
      args.request,
    );

    const refreshed = await readTracker(context.directory);
    refreshed.workflow.state = WORKFLOW_STATES.replanRequired;
    refreshed.workflow.updatedAt = new Date().toISOString();
    refreshed.features = refreshed.features.map((feature) =>
      args.impactedFeatures.includes(feature.id) ? { ...feature, status: "replan_required" } : feature,
    );
    await writeTracker(context.directory, refreshed);

    return {
      title: "Change request recorded",
      output: `Recorded change request ${args.title} and marked workflow as ${WORKFLOW_STATES.replanRequired}.`,
    };
  },
});
