import path from "node:path";

import { tool } from "@opencode-ai/plugin";
import { readTracker, writeTracker } from "@/store";
import { WORKFLOW_STATES } from "@/utils/constants";
import { resolveWorkspacePath } from "@/utils/paths";
import { scaffoldFeature } from "@/workflows";

export const featureSplitTool = tool({
  description: "Create a feature PRD directory with canonical small-file structure.",
  args: {
    title: tool.schema.string().min(1),
  },
  async execute(args, context) {
    const tracker = await readTracker(context.directory);
    const sequence = tracker.features.length + 1;
    const feature = await scaffoldFeature(context.directory, args.title, sequence);

    tracker.features.push({
      ...feature,
      reviewPath: path.join("docs", "features", feature.id, "review.yaml"),
      tasks: [],
    });
    tracker.workflow.state = WORKFLOW_STATES.featureSplitting;
    tracker.workflow.updatedAt = new Date().toISOString();
    await writeTracker(context.directory, tracker);

    return {
      title: "Feature scaffolded",
      output: `Created feature directory at ${resolveWorkspacePath(context.directory, path.join("docs", "features", feature.id))}.`,
    };
  },
});
