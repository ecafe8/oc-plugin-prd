import { tool } from "@opencode-ai/plugin";
import { readSessionState, readTracker, writeSessionState, writeTracker } from "@/store";
import { MASTER_PRD_PATH, WORKFLOW_STATES } from "@/utils/constants";
import { ensureMasterPrd } from "@/workflows";

export const masterPrdGenerateTool = tool({
  description: "Create or refresh the master PRD scaffold for the current workspace.",
  args: {},
  async execute(_args, context) {
    const tracker = await readTracker(context.directory);

    if (!tracker.authoring.discoveryReady) {
      return {
        title: "Discovery not ready",
        output:
          "Discovery is not confirmed ready for drafting. Run `discovery_status` to check what's missing, or run `discovery_confirm` once the user has reviewed and confirmed the discovery summary is complete.",
      };
    }

    await ensureMasterPrd(context.directory);

    tracker.workflow.state = WORKFLOW_STATES.masterPrdDrafting;
    tracker.workflow.updatedAt = new Date().toISOString();
    await writeTracker(context.directory, tracker);

    const session = await readSessionState(context.directory);
    session.workflowState = WORKFLOW_STATES.masterPrdDrafting;
    session.updatedAt = new Date().toISOString();
    await writeSessionState(context.directory, session);

    return {
      title: "Master PRD scaffolded",
      output: `Created ${MASTER_PRD_PATH} and moved workflow to ${WORKFLOW_STATES.masterPrdDrafting}.`,
    };
  },
});
