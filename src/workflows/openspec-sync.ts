import { mapPlanTasksToOpenSpec } from "@/adapters/openspec";
import type { TrackerFeature } from "@/schemas/tracker";
import { FEATURE_STATUSES } from "@/utils/constants";
import { writeText } from "@/utils/fs";
import { resolveWorkspacePath } from "@/utils/paths";

export async function writeOpenSpecHandoff(root: string, feature: TrackerFeature): Promise<string> {
  const filePath = resolveWorkspacePath(root, `openspec/changes/${feature.id}-handoff.md`);
  const mappings = mapPlanTasksToOpenSpec(feature.tasks);
  const content = [
    `# OpenSpec Handoff: ${feature.title}`,
    "",
    `Status: ${FEATURE_STATUSES.implementationReady}`,
    "",
    "## Task Mapping",
    "",
    ...mappings.map((mapping) => `- ${mapping.title}`),
  ].join("\n");

  await writeText(filePath, content);
  return filePath;
}

export function markFeatureImplementationReady(feature: TrackerFeature): TrackerFeature {
  return {
    ...feature,
    status: FEATURE_STATUSES.implementationReady,
  };
}
