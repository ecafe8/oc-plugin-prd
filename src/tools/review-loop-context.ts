import { tool } from "@opencode-ai/plugin";
import { resolveModelWithSource } from "@/adapters/model-selector";
import { reviewRecordSchema } from "@/schemas/review";
import { loadMergedConfig } from "@/store/config";
import { readReview } from "@/store/review";
import { readText } from "@/utils/fs";
import { resolveWorkspacePath } from "@/utils/paths";
import { type ArtifactType, assembleReviewContext, formatReviewPrompt } from "@/workflows/review-loop";

export const reviewLoopContextTool = tool({
  description:
    "Assemble the review context and prompt for a PRD artifact. Call this first, then perform the critique, then call review_loop_execute with your decision.",
  args: {
    artifactType: tool.schema.enum(["master_prd", "feature", "plan"]),
    artifactPath: tool.schema.string().min(1),
    reviewPath: tool.schema.string().min(1),
  },
  async execute(args, context) {
    const [artifactContent, config] = await Promise.all([
      readText(resolveWorkspacePath(context.directory, args.artifactPath)),
      loadMergedConfig(context.directory),
    ]);

    if (!artifactContent) {
      return {
        title: "Artifact not found",
        output: `No content found at ${args.artifactPath}. Ensure the document exists before starting review.`,
      };
    }

    const record = await readReview(context.directory, args.reviewPath).catch(() =>
      reviewRecordSchema.parse({
        decision: { status: "not_reviewed", updatedAt: new Date().toISOString() },
      }),
    );

    const resolved = resolveModelWithSource(config, "review");
    const ctx = assembleReviewContext(args.artifactType as ArtifactType, artifactContent, record, resolved.model);
    const prompt = formatReviewPrompt(ctx);

    return {
      title: "Review context assembled",
      output: prompt,
      metadata: {
        reviewModel: resolved.model,
        modelSource: resolved.source,
        iterationNumber: record.history.length + 1,
        preCheckPassed: ctx.preCheckResult.passed,
        preCheckBlockers: ctx.preCheckResult.blockers,
      },
    };
  },
});
