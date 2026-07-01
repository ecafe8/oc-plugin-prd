import { tool } from "@opencode-ai/plugin";

import { readTracker, writeTracker } from "@/store";
import { FEATURE_STATUSES, WORKFLOW_STATES } from "@/utils/constants";
import { markFeatureImplementationReady, syncOpenSpecStatus, writeOpenSpecHandoff } from "@/workflows";

export const openSpecSyncTool = tool({
  description: "Create a lightweight OpenSpec handoff and synchronize tracker state.",
  args: {
    featureId: tool.schema.string().min(1),
    taskDoneIds: tool.schema.array(tool.schema.string()).default([]),
  },
  async execute(args, context) {
    const tracker = await readTracker(context.directory);
    const feature = tracker.features.find((item) => item.id === args.featureId);
    if (!feature) {
      throw new Error(`Unknown feature: ${args.featureId}`);
    }

    feature.tasks = feature.tasks.map((task) =>
      args.taskDoneIds.includes(task.id) ? { ...task, status: "done" } : task,
    );
    const readyFeature = markFeatureImplementationReady(feature);
    Object.assign(feature, readyFeature);

    const handoffPath = await writeOpenSpecHandoff(context.directory, feature);

    const synced = syncOpenSpecStatus(tracker, feature.id);
    if (synced.workflow.state === WORKFLOW_STATES.completed) {
      await writeTracker(context.directory, synced);
    } else {
      tracker.workflow.state = FEATURE_STATUSES.implementationReady;
      tracker.workflow.updatedAt = new Date().toISOString();
      await writeTracker(context.directory, tracker);
    }

    return {
      title: "OpenSpec synchronized",
      output: `Wrote handoff at ${handoffPath} and synchronized tracker state for ${feature.id}.`,
    };
  },
});
