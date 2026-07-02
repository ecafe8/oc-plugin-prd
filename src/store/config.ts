import path from "node:path";
import { parse as parseJsonc } from "jsonc-parser";

import { type VibeConfig, vibeConfigSchema } from "@/schemas/config";
import { USER_CONFIG_FILE, WORKSPACE_CONFIG_PATH } from "@/utils/constants";
import { readText, readYaml, writeYaml } from "@/utils/fs";
import { resolveWorkspacePath } from "@/utils/paths";

const defaultConfig = vibeConfigSchema.parse({});

async function loadUserConfig(): Promise<Partial<VibeConfig>> {
  const home = process.env.HOME;
  if (!home) {
    return {};
  }

  const filePath = path.join(home, ".config/opencode", USER_CONFIG_FILE);
  const content = await readText(filePath);
  if (!content) {
    return {};
  }

  return vibeConfigSchema.partial().parse(parseJsonc(content));
}

async function loadWorkspaceConfig(root: string): Promise<Partial<VibeConfig>> {
  const filePath = resolveWorkspacePath(root, WORKSPACE_CONFIG_PATH);
  const content = await readYaml<unknown>(filePath);
  if (!content) {
    return {};
  }

  return vibeConfigSchema.partial().parse(content);
}

export async function loadMergedConfig(root: string): Promise<VibeConfig> {
  const [userConfig, workspaceConfig] = await Promise.all([loadUserConfig(), loadWorkspaceConfig(root)]);

  return vibeConfigSchema.parse({
    ...defaultConfig,
    ...userConfig,
    ...workspaceConfig,
    models: {
      ...defaultConfig.models,
      ...userConfig.models,
      ...workspaceConfig.models,
    },
    workflow: {
      ...defaultConfig.workflow,
      ...userConfig.workflow,
      ...workspaceConfig.workflow,
    },
  });
}

export async function writeWorkspaceConfig(root: string, config: Partial<VibeConfig>): Promise<void> {
  const filePath = resolveWorkspacePath(root, WORKSPACE_CONFIG_PATH);
  await writeYaml(filePath, config);
}
