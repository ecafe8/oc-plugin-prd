import { tool } from "@opencode-ai/plugin";

import { readDiscoveryContext, readDiscoveryQuestions } from "@/store/discovery";
import { readTracker } from "@/store/tracker";
import { checkDiscoveryReadiness } from "@/workflows/discovery";

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

    const lines: string[] = [
      `Workflow state: ${tracker.workflow.state}`,
      `Discovery ready: ${readiness.ready ? "yes" : "no"}`,
    ];

    if (!readiness.ready) {
      lines.push(`Missing: ${readiness.missingFields.join(", ")}`);
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
      metadata: { readiness, workflowState: tracker.workflow.state },
    };
  },
});
