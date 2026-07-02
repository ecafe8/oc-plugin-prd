import path from "node:path";

import { type DiscoveryContext, discoveryContextSchema } from "@/schemas/discovery";
import { readValidatedYaml, writeValidatedYaml } from "@/store/base";
import { DISCOVERY_CONTEXT_PATH, DISCOVERY_QUESTIONS_PATH, DISCOVERY_SUMMARY_PATH } from "@/utils/constants";
import { ensureParentDirectory, readText, writeText } from "@/utils/fs";
import { resolveWorkspacePath } from "@/utils/paths";

function createDefaultContext(): DiscoveryContext {
  return discoveryContextSchema.parse({});
}

export async function readDiscoveryContext(root: string): Promise<DiscoveryContext> {
  return readValidatedYaml(
    resolveWorkspacePath(root, DISCOVERY_CONTEXT_PATH),
    discoveryContextSchema,
    createDefaultContext(),
  );
}

export async function writeDiscoveryContext(root: string, ctx: DiscoveryContext): Promise<void> {
  await writeValidatedYaml(resolveWorkspacePath(root, DISCOVERY_CONTEXT_PATH), discoveryContextSchema, ctx);
}

export async function readDiscoverySummary(root: string): Promise<string> {
  return (await readText(resolveWorkspacePath(root, DISCOVERY_SUMMARY_PATH))) ?? "";
}

export async function writeDiscoverySummary(root: string, summary: string): Promise<void> {
  await writeText(resolveWorkspacePath(root, DISCOVERY_SUMMARY_PATH), summary);
}

export async function readDiscoveryQuestions(root: string): Promise<string> {
  return (await readText(resolveWorkspacePath(root, DISCOVERY_QUESTIONS_PATH))) ?? "";
}

export async function writeDiscoveryQuestions(root: string, questions: string): Promise<void> {
  await writeText(resolveWorkspacePath(root, DISCOVERY_QUESTIONS_PATH), questions);
}

export async function ensureDiscoveryDir(root: string): Promise<void> {
  await ensureParentDirectory(path.join(root, DISCOVERY_CONTEXT_PATH));
}
