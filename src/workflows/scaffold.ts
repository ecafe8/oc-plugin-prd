import path from "node:path";

import { type FeatureManifest, featureManifestSchema } from "@/schemas/feature";
import { featureTemplates } from "@/templates/feature";
import { masterPrdTemplate } from "@/templates/master-prd";
import { FEATURE_FILE_NAMES, FEATURE_STATUSES, FEATURES_DIR, MASTER_PRD_PATH } from "@/utils/constants";
import { ensureDirectory, listDirectory, writeText, writeYaml } from "@/utils/fs";
import { featureDirectoryName, resolveWorkspacePath, toKebabCase } from "@/utils/paths";

async function resolveUniqueFeatureDirectory(root: string, slug: string): Promise<string> {
  const existing = await listDirectory(resolveWorkspacePath(root, FEATURES_DIR));
  let suffix = 0;

  while (true) {
    const candidate = featureDirectoryName(slug, suffix === 0 ? undefined : suffix + 1);
    if (!existing.includes(candidate)) {
      return candidate;
    }
    suffix += 1;
  }
}

export async function ensureMasterPrd(root: string): Promise<string> {
  const filePath = resolveWorkspacePath(root, MASTER_PRD_PATH);
  await writeText(filePath, masterPrdTemplate);
  return filePath;
}

export async function scaffoldFeature(root: string, title: string, sequence: number): Promise<FeatureManifest> {
  const slug = toKebabCase(title);
  const directoryName = await resolveUniqueFeatureDirectory(root, slug);
  const directory = resolveWorkspacePath(root, path.join(FEATURES_DIR, directoryName));

  await ensureDirectory(directory);

  for (const [fileName, template] of Object.entries(featureTemplates)) {
    await writeText(path.join(directory, fileName), template);
  }

  await writeYaml(path.join(directory, FEATURE_FILE_NAMES.review), {
    decision: {
      status: "not_reviewed",
      updatedAt: new Date().toISOString(),
    },
    summary: "",
    qualityGates: {},
    documentChecks: {},
  });

  return featureManifestSchema.parse({
    id: directoryName,
    slug,
    sequence,
    title,
    status: FEATURE_STATUSES.draft,
  });
}
