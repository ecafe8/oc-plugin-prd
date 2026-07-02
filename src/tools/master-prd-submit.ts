import { tool } from "@opencode-ai/plugin";

import { readTracker, writeTracker } from "@/store/tracker";
import { MASTER_PRD_PATH, WORKFLOW_STATES } from "@/utils/constants";
import { pathExists } from "@/utils/fs";
import { resolveWorkspacePath } from "@/utils/paths";
import { advanceToMasterPrdReview } from "@/workflows/authoring";

export const masterPrdSubmitTool = tool({
  description: "Advance the master PRD workflow to master_prd_review when the current draft is ready for review.",
  args: {},
  async execute(_args, context) {
    const draftPath = resolveWorkspacePath(context.directory, MASTER_PRD_PATH);
    if (!(await pathExists(draftPath))) {
      return {
        title: "No draft found",
        output: `No master PRD draft exists at ${MASTER_PRD_PATH}. Run \`master_prd_draft\` with content to create one.`,
      };
    }

    const tracker = await readTracker(context.directory);

    if (
      tracker.workflow.state !== WORKFLOW_STATES.masterPrdDrafting &&
      tracker.workflow.state !== WORKFLOW_STATES.projectDiscovery
    ) {
      return {
        title: "Invalid state for submission",
        output: `Workflow is currently ${tracker.workflow.state}. Submission to review requires ${WORKFLOW_STATES.masterPrdDrafting}.`,
      };
    }

    const advanced = advanceToMasterPrdReview(tracker);
    await writeTracker(context.directory, advanced);

    return {
      title: "Master PRD submitted for review",
      output: `Workflow advanced to ${WORKFLOW_STATES.masterPrdReview}. Run \`master_prd_review\` to record the review decision.`,
    };
  },
});
