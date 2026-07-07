import { tool } from "@opencode-ai/plugin";

import { readDiscoveryContext, readDiscoveryQuestions } from "@/store/discovery";
import { readTracker } from "@/store/tracker";
import { checkDiscoveryReadiness, computeDraftingReadinessState } from "@/workflows/discovery";

const STATE_LABELS = {
  fields_incomplete: "no (fields incomplete)",
  pending_confirmation: "no (pending confirmation)",
  confirmed: "yes",
} as const;

export const discoveryStatusTool = tool({
  description: "Show current discovery readiness, missing inputs, and open questions.",
  args: {},
  async execute(_args, context) {
    const ctx = await readDiscoveryContext(context.directory);
    const questionsText = await readDiscoveryQuestions(context.directory);
    const questions = questionsText
      .split("\n")
      .filter((line) => line.startsWith("- "))
      .map((line) => line.slice(2));
    const tracker = await readTracker(context.directory);
    const readiness = checkDiscoveryReadiness(ctx, questions.length);
    const state = computeDraftingReadinessState(ctx, questions.length);

    const lines: string[] = [`Workflow state: ${tracker.workflow.state}`, `Discovery ready: ${STATE_LABELS[state]}`];

    if (state === "fields_incomplete") {
      lines.push(`Missing: ${readiness.missingFields.join(", ")}`);
    } else if (state === "pending_confirmation") {
      lines.push(
        "Fields are complete but discussion has not been explicitly confirmed. Run `discovery_confirm` once the user has reviewed the discovery summary and is ready to proceed.",
      );
    } else {
      lines.push("Confirmed. Run `master_prd_draft` to generate the master PRD.");
    }

    if (questions.length > 0) {
      lines.push(`Open questions (${questions.length}):`, ...questions.map((q) => `  - ${q}`));
    } else {
      lines.push("Open questions: none");
    }

    if (ctx.goal) {
      lines.push(`Goal: ${ctx.goal}`);
    }

    return {
      title: "Discovery status",
      output: lines.join("\n"),
      metadata: { readiness, state, workflowState: tracker.workflow.state },
    };
  },
});
