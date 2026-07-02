import path from "node:path";

import type { FeatureCandidate, PendingCandidateSet } from "@/schemas/candidate";
import { featureCandidateSchema } from "@/schemas/candidate";
import type { FeatureManifest } from "@/schemas/feature";
import { featureManifestSchema } from "@/schemas/feature";
import type { Tracker } from "@/schemas/tracker";
import { featureTemplates } from "@/templates/feature";
import { FEATURE_FILE_NAMES, FEATURE_STATUSES, FEATURES_DIR, WORKFLOW_STATES } from "@/utils/constants";
import { listDirectory, writeText, writeYaml } from "@/utils/fs";
import { featureDirectoryName, resolveWorkspacePath, toKebabCase } from "@/utils/paths";

// ── Slug deduplication ───────────────────────────────────────────────────────

export function deduplicateCandidates(raw: FeatureCandidate[]): FeatureCandidate[] {
  const seen = new Map<string, number>(); // slug → occurrence count
  return raw.map((candidate) => {
    const base = candidate.slug || toKebabCase(candidate.title);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    const slug = count === 0 ? base : `${base}-${count + 1}`;
    return featureCandidateSchema.parse({ ...candidate, slug });
  });
}

export function normalizeCandidates(raw: Array<Partial<FeatureCandidate>>): FeatureCandidate[] {
  const withSlugs = raw.map((c) =>
    featureCandidateSchema.parse({
      ...c,
      slug: c.slug ?? toKebabCase(c.title ?? "feature"),
    }),
  );
  return deduplicateCandidates(withSlugs);
}

// ── Confirmation gate ────────────────────────────────────────────────────────

export function formatCandidateList(set: PendingCandidateSet): string {
  if (set.candidates.length === 0) {
    return "No candidates generated.";
  }

  return [
    `Generated ${set.candidates.length} feature candidate(s):`,
    "",
    ...set.candidates.map((c, i) => {
      const deps = c.dependsOn.length > 0 ? `  deps: ${c.dependsOn.join(", ")}` : "";
      const soft = c.softDependsOn.length > 0 ? `  soft: ${c.softDependsOn.join(", ")}` : "";
      return [`${i + 1}. [${c.priority.toUpperCase()}] ${c.title} (${c.slug})`, `   ${c.summary}`, deps, soft]
        .filter(Boolean)
        .join("\n");
    }),
    "",
    "To proceed: call `feature_candidates_materialize` with the slugs you want to create.",
    "To discard any: simply omit their slugs from the materialize call.",
  ].join("\n");
}

// ── Materialization ──────────────────────────────────────────────────────────

function buildIndexContent(candidate: FeatureCandidate, directoryName: string): string {
  const deps = candidate.dependsOn.length > 0 ? candidate.dependsOn.map((d) => `- ${d}`).join("\n") : "- _(none)_";

  const softDeps =
    candidate.softDependsOn.length > 0 ? candidate.softDependsOn.map((d) => `- ${d}`).join("\n") : "- _(none)_";

  const sources =
    candidate.sourceSections.length > 0
      ? candidate.sourceSections.map((s) => `- ${s}`).join("\n")
      : "- _(not specified)_";

  return [
    `# Feature Summary`,
    ``,
    `## Identity`,
    ``,
    `- ID: ${directoryName}`,
    `- Title: ${candidate.title}`,
    `- Status: draft`,
    `- Priority: ${candidate.priority}`,
    ``,
    `## Summary`,
    ``,
    candidate.summary || "_(to be filled in)_",
    ``,
    `## Source`,
    ``,
    `**Rationale:** ${candidate.rationale || "_(not specified)_"}`,
    ``,
    `**Master PRD Sections:**`,
    ``,
    sources,
    ``,
    `## Documents`,
    ``,
    `- Foundation: ./01-foundation.md`,
    `- Product: ./02-product.md`,
    `- UI/UX: ./03-ui-ux.md`,
    `- Technical: ./04-technical.md`,
    `- Plan: ./05-plan.md`,
    ``,
    `## Dependencies`,
    ``,
    deps,
    ``,
    `## Blockers / Soft Dependencies`,
    ``,
    softDeps,
  ].join("\n");
}

export async function resolveUniqueDirectoryName(root: string, slug: string): Promise<string> {
  const existing = await listDirectory(resolveWorkspacePath(root, FEATURES_DIR));
  let suffix = 0;

  while (true) {
    const name = featureDirectoryName(slug, suffix === 0 ? undefined : suffix + 1);
    if (!existing.includes(name)) {
      return name;
    }
    suffix += 1;
  }
}

export async function materializeCandidate(
  root: string,
  candidate: FeatureCandidate,
  sequence: number,
): Promise<FeatureManifest> {
  const directoryName = await resolveUniqueDirectoryName(root, candidate.slug);
  const directory = resolveWorkspacePath(root, path.join(FEATURES_DIR, directoryName));

  // Write all document templates except index (we write a custom one)
  for (const [fileName, template] of Object.entries(featureTemplates)) {
    if (fileName !== FEATURE_FILE_NAMES.index) {
      await writeText(path.join(directory, fileName), template);
    }
  }

  // Write custom index with source traceability and dependency info
  await writeText(path.join(directory, FEATURE_FILE_NAMES.index), buildIndexContent(candidate, directoryName));

  // Write blank review record
  await writeYaml(path.join(directory, FEATURE_FILE_NAMES.review), {
    decision: { status: "not_reviewed", updatedAt: new Date().toISOString() },
    summary: "",
    qualityGates: {},
    documentChecks: {},
  });

  return featureManifestSchema.parse({
    id: directoryName,
    slug: candidate.slug,
    sequence,
    title: candidate.title,
    status: FEATURE_STATUSES.draft,
    dependencies: candidate.dependsOn,
    blockers: candidate.softDependsOn,
  });
}

// ── Tracker update ───────────────────────────────────────────────────────────

export function startFeatureSplitting(tracker: Tracker): Tracker {
  return {
    ...tracker,
    workflow: {
      ...tracker.workflow,
      state: WORKFLOW_STATES.featureSplitting,
      updatedAt: new Date().toISOString(),
    },
  };
}
