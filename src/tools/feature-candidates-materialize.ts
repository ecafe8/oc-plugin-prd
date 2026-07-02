import { tool } from "@opencode-ai/plugin";

import { readPendingCandidates } from "@/store/candidates";
import { readTracker, writeTracker } from "@/store/tracker";
import { materializeCandidate, startFeatureSplitting } from "@/workflows/decomposition";

export const featureCandidatesMaterializeTool = tool({
  description:
    "Materialize confirmed feature candidates into feat-<slug> directories. Pass the slugs of candidates you want to create; any not listed are discarded.",
  args: {
    confirmedSlugs: tool.schema.array(tool.schema.string().min(1)).min(1),
  },
  async execute(args, context) {
    const pending = await readPendingCandidates(context.directory);
    if (pending.candidates.length === 0) {
      return {
        title: "No pending candidates",
        output: "No feature candidates found. Run `feature_candidates_generate` first.",
      };
    }

    const confirmedSet = new Set(args.confirmedSlugs);
    const toMaterialize = pending.candidates.filter((c) => confirmedSet.has(c.slug));

    if (toMaterialize.length === 0) {
      return {
        title: "No matching candidates",
        output: `None of the provided slugs matched pending candidates. Available: ${pending.candidates.map((c) => c.slug).join(", ")}`,
      };
    }

    // Begin splitting — update tracker state first
    const tracker = await readTracker(context.directory);
    const splitting = startFeatureSplitting(tracker);
    await writeTracker(context.directory, splitting);

    // Materialize each confirmed candidate
    const created: string[] = [];
    const existingCount = splitting.features.length;

    for (const [i, candidate] of toMaterialize.entries()) {
      const feature = await materializeCandidate(context.directory, candidate, existingCount + i + 1);

      splitting.features.push({
        ...feature,
        reviewPath: `docs/features/${feature.id}/review.yaml`,
        tasks: [],
      });

      created.push(feature.id);
    }

    await writeTracker(context.directory, splitting);

    const discarded = pending.candidates.filter((c) => !confirmedSet.has(c.slug)).map((c) => c.slug);

    const lines = [`Materialized ${created.length} feature(s):`, ...created.map((id) => `  ✓ docs/features/${id}/`)];
    if (discarded.length > 0) {
      lines.push(`Discarded ${discarded.length}: ${discarded.join(", ")}`);
    }
    lines.push(`Workflow state: feature_splitting`);

    return {
      title: "Features materialized",
      output: lines.join("\n"),
      metadata: { created, discarded },
    };
  },
});
