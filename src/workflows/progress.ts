import type { Tracker } from "@/schemas/tracker";
import { FEATURE_STATUSES, TASK_STATUSES, WORKFLOW_STATES } from "@/utils/constants";

export function summarizeTracker(tracker: Tracker): string {
  const featureCounts = tracker.features.reduce(
    (acc, feature) => {
      acc.total += 1;
      if (feature.status === FEATURE_STATUSES.done) {
        acc.done += 1;
      }
      if (feature.status === FEATURE_STATUSES.replanRequired) {
        acc.replan += 1;
      }
      return acc;
    },
    { total: 0, done: 0, replan: 0 },
  );

  const taskCounts = tracker.features
    .flatMap((feature) => feature.tasks)
    .reduce(
      (acc, task) => {
        acc.total += 1;
        if (task.status === TASK_STATUSES.done) {
          acc.done += 1;
        }
        return acc;
      },
      { total: 0, done: 0 },
    );

  return [
    `Workflow: ${tracker.workflow.state}`,
    `Features: ${featureCounts.done}/${featureCounts.total} done`,
    `Tasks: ${taskCounts.done}/${taskCounts.total} done`,
    `Replan Required: ${featureCounts.replan}`,
  ].join("\n");
}

export function syncOpenSpecStatus(tracker: Tracker, featureId: string): Tracker {
  const next = structuredClone(tracker);
  const feature = next.features.find((item) => item.id === featureId);
  if (!feature) {
    return next;
  }

  if (feature.tasks.length > 0 && feature.tasks.every((task) => task.status === TASK_STATUSES.done)) {
    feature.status = FEATURE_STATUSES.done;
    next.workflow.state = WORKFLOW_STATES.completed;
    next.workflow.updatedAt = new Date().toISOString();
  }

  return next;
}
