import { tool } from "@opencode-ai/plugin";

import {
  readDiscoveryContext,
  readDiscoveryQuestions,
  writeDiscoveryContext,
  writeDiscoveryQuestions,
  writeDiscoverySummary,
} from "@/store/discovery";
import { readTracker, writeTracker } from "@/store/tracker";
import {
  applyAuthoringMeta,
  checkDiscoveryReadiness,
  computeDraftingReadinessState,
  formatDiscoverySummary,
  mergeDiscoveryContext,
} from "@/workflows/discovery";

export const discoveryUpdateTool = tool({
  description:
    "Merge additional goals, actors, constraints, assumptions, or success measures into existing discovery context.",
  args: {
    goal: tool.schema.string().optional(),
    actors: tool.schema.array(tool.schema.string()).optional(),
    constraints: tool.schema.array(tool.schema.string()).optional(),
    assumptions: tool.schema.array(tool.schema.string()).optional(),
    successMeasures: tool.schema.array(tool.schema.string()).optional(),
    resolvedQuestions: tool.schema.array(tool.schema.string()).optional(),
    newQuestions: tool.schema.array(tool.schema.string()).optional(),
  },
  async execute(args, context) {
    const existing = await readDiscoveryContext(context.directory);
    const merged = mergeDiscoveryContext(existing, {
      goal: args.goal,
      actors: args.actors,
      constraints: args.constraints,
      assumptions: args.assumptions,
      successMeasures: args.successMeasures,
    });
    await writeDiscoveryContext(context.directory, merged);
    await writeDiscoverySummary(context.directory, formatDiscoverySummary(merged));

    // Update questions by removing resolved and adding new
    const currentQText = await readDiscoveryQuestions(context.directory);
    let questions = currentQText
      .split("\n")
      .filter((line) => line.startsWith("- "))
      .map((line) => line.slice(2));

    if (args.resolvedQuestions && args.resolvedQuestions.length > 0) {
      const resolved = new Set(args.resolvedQuestions.map((q) => q.toLowerCase()));
      questions = questions.filter((q) => !resolved.has(q.toLowerCase()));
    }
    if (args.newQuestions && args.newQuestions.length > 0) {
      questions = [...questions, ...args.newQuestions];
    }

    const questionsText =
      questions.length > 0
        ? `# Open Questions\n\n${questions.map((q) => `- ${q}`).join("\n")}\n`
        : "# Open Questions\n\n_No open questions._\n";
    await writeDiscoveryQuestions(context.directory, questionsText);

    const readiness = checkDiscoveryReadiness(merged, questions.length);
    const state = computeDraftingReadinessState(merged, questions.length);
    const tracker = await readTracker(context.directory);
    const updated = applyAuthoringMeta(tracker, {
      discoveryReady: state === "confirmed",
      lastDiscoveryUpdate: new Date().toISOString(),
      pendingQuestionsCount: questions.length,
    });
    await writeTracker(context.directory, updated);

    const messages: Record<typeof state, string> = {
      fields_incomplete: `Discovery updated. Still missing: ${readiness.missingFields.join(", ")}.`,
      pending_confirmation:
        "Discovery fields look complete. Once the user has reviewed the discovery summary and confirms discussion is done, run `discovery_confirm` before drafting the master PRD.",
      confirmed: "Discovery is still confirmed ready for drafting. Run `master_prd_draft` to generate the master PRD.",
    };

    return {
      title: "Discovery updated",
      output: messages[state],
      metadata: { readiness, state },
    };
  },
});
