import { tool } from "@opencode-ai/plugin";

import { discoveryContextSchema } from "@/schemas/discovery";
import {
  ensureDiscoveryDir,
  writeDiscoveryContext,
  writeDiscoveryQuestions,
  writeDiscoverySummary,
} from "@/store/discovery";
import { readTracker, writeTracker } from "@/store/tracker";
import { WORKFLOW_STATES } from "@/utils/constants";
import {
  applyAuthoringMeta,
  checkDiscoveryReadiness,
  computeDraftingReadinessState,
  formatDiscoverySummary,
} from "@/workflows/discovery";

export const discoveryCapturetool = tool({
  description:
    "Capture an initial natural-language project goal and persist structured discovery context artifacts in .vibe/discovery/.",
  args: {
    goal: tool.schema.string().min(1),
    actors: tool.schema.array(tool.schema.string()).default([]),
    constraints: tool.schema.array(tool.schema.string()).default([]),
    assumptions: tool.schema.array(tool.schema.string()).default([]),
    successMeasures: tool.schema.array(tool.schema.string()).default([]),
    openQuestions: tool.schema.array(tool.schema.string()).default([]),
  },
  async execute(args, context) {
    await ensureDiscoveryDir(context.directory);

    const ctx = discoveryContextSchema.parse({
      goal: args.goal,
      actors: args.actors,
      constraints: args.constraints,
      assumptions: args.assumptions,
      successMeasures: args.successMeasures,
      updatedAt: new Date().toISOString(),
    });

    await writeDiscoveryContext(context.directory, ctx);
    await writeDiscoverySummary(context.directory, formatDiscoverySummary(ctx));

    const questionsText =
      args.openQuestions.length > 0
        ? `# Open Questions\n\n${args.openQuestions.map((q) => `- ${q}`).join("\n")}\n`
        : "# Open Questions\n\n_No open questions._\n";
    await writeDiscoveryQuestions(context.directory, questionsText);

    const readiness = checkDiscoveryReadiness(ctx, args.openQuestions.length);
    const state = computeDraftingReadinessState(ctx, args.openQuestions.length);
    const tracker = await readTracker(context.directory);
    const updated = applyAuthoringMeta(
      {
        ...tracker,
        workflow: {
          ...tracker.workflow,
          state: WORKFLOW_STATES.projectDiscovery,
          updatedAt: new Date().toISOString(),
        },
        project: {
          ...tracker.project,
          summary: args.goal,
        },
      },
      {
        discoveryReady: state === "confirmed",
        lastDiscoveryUpdate: new Date().toISOString(),
        pendingQuestionsCount: args.openQuestions.length,
      },
    );
    await writeTracker(context.directory, updated);

    const messages: Record<typeof state, string> = {
      fields_incomplete: `Discovery saved. Missing: ${readiness.missingFields.join(", ")}. Run \`discovery_update\` to complete.`,
      pending_confirmation:
        "Discovery fields look complete. Once the user has reviewed the discovery summary and confirms discussion is done, run `discovery_confirm` before drafting the master PRD.",
      confirmed: "Discovery confirmed ready for drafting. Run `master_prd_draft` to generate the master PRD.",
    };

    return {
      title: "Discovery captured",
      output: messages[state],
      metadata: { readiness, state },
    };
  },
});
