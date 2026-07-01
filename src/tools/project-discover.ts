import { tool } from "@opencode-ai/plugin";

import { readSessionState, readTracker, writeSessionState, writeTracker } from "@/store";
import { WORKFLOW_STATES } from "@/utils/constants";

export const projectDiscoverTool = tool({
  description: "Initialize or resume PRD harness discovery for the current workspace.",
  args: {
    goal: tool.schema.string().min(1),
  },
  async execute(args, context) {
    const tracker = await readTracker(context.directory);
    tracker.project.summary = args.goal;
    tracker.workflow.state = WORKFLOW_STATES.projectDiscovery;
    tracker.workflow.updatedAt = new Date().toISOString();
    await writeTracker(context.directory, tracker);

    const session = await readSessionState(context.directory);
    session.workflowState = WORKFLOW_STATES.projectDiscovery;
    session.updatedAt = new Date().toISOString();
    await writeSessionState(context.directory, session);

    return {
      title: "Project discovery recorded",
      output: `Stored project discovery goal and set workflow to ${WORKFLOW_STATES.projectDiscovery}.`,
    };
  },
});
