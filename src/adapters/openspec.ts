import path from "node:path";

import type { TaskRecord } from "@/schemas/feature";
import type { TrackerFeature } from "@/schemas/tracker";
import { TASK_STATUSES } from "@/utils/constants";
import { pathExists, readText, writeText } from "@/utils/fs";
import { resolveWorkspacePath } from "@/utils/paths";

export interface OpenSpecTaskMapping {
  title: string;
  affectedAreas: string[];
  verification: string[];
}

export function mapPlanTasksToOpenSpec(tasks: TaskRecord[]): OpenSpecTaskMapping[] {
  return tasks.map((task) => ({
    title: task.title,
    affectedAreas: task.targets,
    verification: task.verification,
  }));
}

// ── Structured change generation ─────────────────────────────────────────────

export function buildOpenSpecChangeContent(feature: TrackerFeature, generatedAt: string): string {
  const taskLines = feature.tasks.map((task) => {
    const done = task.status === TASK_STATUSES.done;
    const targets = task.targets.length > 0 ? ` [${task.targets.join(", ")}]` : "";
    return `- [${done ? "x" : " "}] ${task.id} ${task.title}${targets}`;
  });

  return [
    `# OpenSpec Change: ${feature.title}`,
    "",
    "## Feature",
    "",
    `- **ID**: ${feature.id}`,
    `- **Title**: ${feature.title}`,
    `- **Status**: ${feature.status}`,
    `- **Source plan**: docs/features/${feature.id}/05-plan.md`,
    "",
    "## Implementation Tasks",
    "",
    taskLines.length > 0 ? taskLines.join("\n") : "_(no tasks defined)_",
    "",
    "## Dependencies",
    "",
    feature.dependencies.length > 0 ? feature.dependencies.map((d) => `- ${d}`).join("\n") : "- _(none)_",
    "",
    "## Traceability",
    "",
    `- **Feature ID**: ${feature.id}`,
    `- **Slug**: ${feature.slug}`,
    `- **Generated**: ${generatedAt}`,
  ].join("\n");
}

export function openSpecChangePath(root: string, featureId: string): string {
  return resolveWorkspacePath(root, path.join("openspec", "changes", `${featureId}.md`));
}

export async function writeOpenSpecChange(
  root: string,
  feature: TrackerFeature,
): Promise<{ path: string; isUpdate: boolean }> {
  const filePath = openSpecChangePath(root, feature.id);
  const isUpdate = await pathExists(filePath);
  const content = buildOpenSpecChangeContent(feature, new Date().toISOString());
  await writeText(filePath, content);
  return { path: filePath, isUpdate };
}

// ── Task-status parsing (for sync) ───────────────────────────────────────────

export function parseOpenSpecTaskStatus(content: string): Map<string, boolean> {
  const result = new Map<string, boolean>();
  const linePattern = /^- \[([x ])\] ([A-Z_0-9-]+) /gm;
  for (let match = linePattern.exec(content); match !== null; match = linePattern.exec(content)) {
    const done = match[1] === "x";
    const taskId = match[2] ?? "";
    if (taskId) {
      result.set(taskId, done);
    }
  }

  return result;
}

export async function readOpenSpecTaskStatus(root: string, featureId: string): Promise<Map<string, boolean>> {
  const filePath = openSpecChangePath(root, featureId);
  const content = await readText(filePath);
  if (!content) return new Map();
  return parseOpenSpecTaskStatus(content);
}
