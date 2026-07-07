import { tool } from "@opencode-ai/plugin";

import { readDiscoveryContext, readDiscoveryQuestions, writeDiscoveryContext } from "@/store/discovery";
import { readTracker, writeTracker } from "@/store/tracker";
import { applyAuthoringMeta, checkDiscoveryReadiness } from "@/workflows/discovery";

function countOpenQuestions(questionsText: string): number {
  return questionsText.split("\n").filter((line) => line.startsWith("- ")).length;
}

export const discoveryConfirmTool = tool({
  description:
    "Explicitly confirm that discovery discussion is complete and the user is ready to proceed to master PRD drafting. Only call this after the user has explicitly confirmed in conversation — do not call it automatically just because required fields happen to be filled in. Required fields must already be complete; otherwise this call is rejected.",
  args: {},
  async execute(_args, context) {
    const ctx = await readDiscoveryContext(context.directory);
    const questionsText = await readDiscoveryQuestions(context.directory);
    const openQuestionsCount = countOpenQuestions(questionsText);

    const readiness = checkDiscoveryReadiness(ctx, openQuestionsCount);
    if (!readiness.ready) {
      return {
        title: "Cannot confirm discovery",
        output: `Discovery fields are still incomplete. Missing: ${readiness.missingFields.join(", ")}. Resolve these with \`discovery_update\` before confirming.`,
        metadata: { readiness, state: "fields_incomplete" },
      };
    }

    const confirmed = { ...ctx, readyForDrafting: true, updatedAt: new Date().toISOString() };
    await writeDiscoveryContext(context.directory, confirmed);

    const tracker = await readTracker(context.directory);
    const updated = applyAuthoringMeta(tracker, {
      discoveryReady: true,
      lastDiscoveryUpdate: new Date().toISOString(),
      pendingQuestionsCount: openQuestionsCount,
    });
    await writeTracker(context.directory, updated);

    return {
      title: "Discovery confirmed",
      output: "Discovery confirmed ready for drafting. Run `master_prd_draft` to generate the master PRD.",
      metadata: { readiness, state: "confirmed" },
    };
  },
});
