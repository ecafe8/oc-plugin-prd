import { tool } from "@opencode-ai/plugin";

import { loadMergedConfig, readDiscoveryContext, readDiscoverySummary, readTracker, writeTracker } from "@/store";
import { MASTER_PRD_PATH, WORKFLOW_STATES } from "@/utils/constants";
import { writeText } from "@/utils/fs";
import { resolveWorkspacePath } from "@/utils/paths";
import { advanceToMasterPrdDrafting, assembleAuthoringContext, formatAuthoringPrompt } from "@/workflows/authoring";

export const masterPrdDraftTool = tool({
  description:
    "Assemble discovery context and produce an authoring prompt for the master PRD. If supplied with drafted content, writes it to docs/master-prd.md and advances workflow to master_prd_drafting.",
  args: {
    content: tool.schema.string().optional(),
  },
  async execute(args, context) {
    const [tracker, discoveryContext, discoverySummary, config] = await Promise.all([
      readTracker(context.directory),
      readDiscoveryContext(context.directory),
      readDiscoverySummary(context.directory),
      loadMergedConfig(context.directory),
    ]);

    if (!tracker.authoring.discoveryReady) {
      return {
        title: "Discovery not ready",
        output:
          "Discovery is not confirmed ready for drafting. Run `discovery_status` to check what's missing, or run `discovery_confirm` once the user has reviewed and confirmed the discovery summary is complete.",
      };
    }

    // If drafted content is provided, write it and advance workflow
    if (args.content) {
      await writeText(resolveWorkspacePath(context.directory, MASTER_PRD_PATH), args.content);
      const advanced = advanceToMasterPrdDrafting(tracker);
      await writeTracker(context.directory, advanced);

      return {
        title: "Master PRD draft saved",
        output: `Wrote master PRD to ${MASTER_PRD_PATH}. Workflow is now ${WORKFLOW_STATES.masterPrdDrafting}. Run \`master_prd_submit\` when ready for review.`,
      };
    }

    // Otherwise return the assembled context for the agent to use for generation
    const authoringCtx = await assembleAuthoringContext(
      context.directory,
      tracker,
      discoveryContext,
      discoverySummary,
      config,
    );
    const prompt = formatAuthoringPrompt(authoringCtx);

    return {
      title: "Master PRD authoring context",
      output: [
        "Use the following context to draft docs/master-prd.md, then call master_prd_draft with the content argument to save it.",
        authoringCtx.draftingModel ? `Preferred drafting model: ${authoringCtx.draftingModel}` : "",
        "",
        prompt,
      ]
        .filter(Boolean)
        .join("\n"),
      metadata: {
        draftingModel: authoringCtx.draftingModel,
        hasExistingDraft: authoringCtx.existingDraft !== null,
      },
    };
  },
});
