import { tool } from "@opencode-ai/plugin";

import { readTracker, writeTracker } from "@/store/tracker";
import { FEATURE_STATUSES, WORKFLOW_STATES } from "@/utils/constants";
import { generateFeatureOpenSpecChange } from "@/workflows/openspec-sync";

export const openspecGenerateTool = tool({
  description:
    "Generate or update structured OpenSpec implementation artifacts from an approved feature plan. Preserves source identity and traceability. Updates in place if an artifact already exists.",
  args: {
    featureId: tool.schema.string().min(1),
  },
  async execute(args, context) {
    const tracker = await readTracker(context.directory);
    const feature = tracker.features.find((f) => f.id === args.featureId);

    if (!feature) {
      return { title: "Feature not found", output: `No feature with id "${args.featureId}" in tracker.` };
    }

    if (
      feature.status !== FEATURE_STATUSES.implementationReady &&
      feature.status !== FEATURE_STATUSES.implementationInProgress
    ) {
      return {
        title: "Feature not ready",
        output: `Feature ${args.featureId} is "${feature.status}". Requires "${FEATURE_STATUSES.implementationReady}" status.`,
      };
    }

    const { path: artifactPath, isUpdate } = await generateFeatureOpenSpecChange(context.directory, feature);

    // Advance feature and workflow state if not already in progress
    const featureInTracker = tracker.features.find((f) => f.id === args.featureId);
    if (featureInTracker && featureInTracker.status !== FEATURE_STATUSES.implementationInProgress) {
      featureInTracker.status = FEATURE_STATUSES.implementationInProgress;
      tracker.workflow.state = WORKFLOW_STATES.implementationInProgress;
      tracker.workflow.updatedAt = new Date().toISOString();
      await writeTracker(context.directory, tracker);
    }

    return {
      title: isUpdate ? "OpenSpec artifact updated" : "OpenSpec artifact created",
      output: [
        `${isUpdate ? "Updated" : "Created"} OpenSpec change for feature ${args.featureId}`,
        `Path: ${artifactPath}`,
        `Tasks mapped: ${feature.tasks.length}`,
      ].join("\n"),
      metadata: { path: artifactPath, isUpdate, taskCount: feature.tasks.length },
    };
  },
});
