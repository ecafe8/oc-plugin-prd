import { tool } from "@opencode-ai/plugin";
import { z } from "zod";

import { readPendingCandidates, readReview, writePendingCandidates } from "@/store";
import { REVIEW_STATUSES } from "@/utils/constants";
import { formatCandidateList, normalizeCandidates } from "@/workflows/decomposition";

const candidateInputSchema = z.object({
  title: z.string().min(1),
  summary: z.string().optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
  sourceSections: z.array(z.string()).optional(),
  dependsOn: z.array(z.string()).optional(),
  softDependsOn: z.array(z.string()).optional(),
  rationale: z.string().optional(),
});

export const featureCandidatesGenerateTool = tool({
  description:
    "Validate and store feature candidates derived from the approved master PRD. Presents candidates for user confirmation before any directories are created.",
  args: {
    masterPrdReviewPath: tool.schema.string().default(".vibe/reviews/master-prd.yaml"),
    candidates: tool.schema.array(candidateInputSchema).min(1),
  },
  async execute(args, context) {
    // Guard: master PRD must be approved
    const review = await readReview(context.directory, args.masterPrdReviewPath);
    if (review.decision.status !== REVIEW_STATUSES.approved) {
      return {
        title: "Master PRD not approved",
        output: `Decomposition blocked. Master PRD review status is "${review.decision.status}". Approve the master PRD review before generating feature candidates.`,
      };
    }

    const normalized = normalizeCandidates(args.candidates);
    const set = await readPendingCandidates(context.directory);
    const updated = {
      ...set,
      generatedAt: new Date().toISOString(),
      masterPrdApprovedAt: new Date().toISOString(),
      candidates: normalized,
    };
    await writePendingCandidates(context.directory, updated);

    return {
      title: "Feature candidates generated",
      output: formatCandidateList(updated),
      metadata: { count: normalized.length, slugs: normalized.map((c) => c.slug) },
    };
  },
});
