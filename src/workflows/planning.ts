import path from "node:path";

import type { TaskRecord } from "@/schemas/feature";
import type { ReviewRecord } from "@/schemas/review";
import type { TrackerFeature } from "@/schemas/tracker";
import { REVIEW_STATUSES, TASK_STATUSES } from "@/utils/constants";
import { writeText } from "@/utils/fs";
import { resolveWorkspacePath } from "@/utils/paths";

function toTaskId(feature: TrackerFeature, index: number): string {
  return `${feature.slug.toUpperCase().replace(/-/g, "_")}-${index + 1}`;
}

function buildPlanTask(feature: TrackerFeature, index: number, line: string): TaskRecord {
  return {
    id: toTaskId(feature, index),
    title: line,
    status: TASK_STATUSES.pending,
    dependsOn: index === 0 ? [] : [toTaskId(feature, index - 1)],
    targets: [path.join("docs", "features", feature.id)],
    verification: ["Review generated implementation output"],
  };
}

export function canGeneratePlan(review: ReviewRecord): boolean {
  return review.decision.status === REVIEW_STATUSES.approved;
}

export async function writeFeaturePlan(root: string, feature: TrackerFeature, steps: string[]): Promise<TaskRecord[]> {
  const tasks = steps.map((step, index) => buildPlanTask(feature, index, step));
  const content = [
    "# Plan",
    "",
    "## Tasks",
    "",
    ...tasks.map((task) => `- [ ] ${task.id} ${task.title}`),
    "",
    "## Verification",
    "",
    ...tasks.flatMap((task) => task.verification.map((item) => `- ${item}`)),
  ].join("\n");

  const filePath = resolveWorkspacePath(root, path.join("docs", "features", feature.id, "05-plan.md"));
  await writeText(filePath, content);

  return tasks;
}
