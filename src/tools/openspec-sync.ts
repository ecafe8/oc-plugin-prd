import { tool } from "@opencode-ai/plugin";

import { readTracker, writeTracker } from "@/store/tracker";
import {
  applyOpenSpecSync,
  computeSyncResult,
  formatSyncResult,
  markFeatureImplementationReady,
  syncOpenSpecStatus,
} from "@/workflows";

export const openSpecSyncTool = tool({
  description:
    "Synchronize tracker task and feature state from OpenSpec implementation progress. Detects no-ops, reports conflicts, and preserves tracker authority for workflow state.",
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

    // Apply manual task-done overrides first (from agent/user input)
    feature.tasks = feature.tasks.map((task) =>
      args.taskDoneIds.includes(task.id) ? { ...task, status: "done" } : task,
    );

    // Compute sync against OpenSpec artifact
    const syncResult = await computeSyncResult(context.directory, feature);
    let updatedTracker = tracker;

    if (!syncResult.noOp) {
      updatedTracker = applyOpenSpecSync(tracker, feature.id, syncResult.updatedTaskIds);
    }

    // Generate/update OpenSpec handoff artifact
    const readyFeature = markFeatureImplementationReady(feature);
    Object.assign(feature, readyFeature);

    // Check if all tasks done → advance workflow
    const synced = syncOpenSpecStatus(updatedTracker, feature.id);
    await writeTracker(context.directory, synced);

    return {
      title: "OpenSpec synchronized",
      output: formatSyncResult(syncResult, feature.id),
      metadata: {
        noOp: syncResult.noOp,
        conflicts: syncResult.conflicts.length,
        updatedTasks: syncResult.updatedTaskIds.length,
        featureStatus: synced.features.find((f) => f.id === feature.id)?.status,
        workflowState: synced.workflow.state,
      },
    };
  },
});
