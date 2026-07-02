import type { Tracker } from "@/schemas/tracker";
import { FEATURE_STATUSES, TASK_STATUSES, WORKFLOW_STATES } from "@/utils/constants";

// ── Aggregated progress model ────────────────────────────────────────────────

export interface AggregatedProgress {
  workflowState: string;
  features: {
    total: number;
    done: number;
    active: number;
    blocked: number;
    replanRequired: number;
    pending: number;
  };
  tasks: {
    total: number;
    done: number;
    inProgress: number;
    blocked: number;
    pending: number;
  };
  changeRequests: {
    total: number;
    active: number;
  };
  hasBlockers: boolean;
  hasReplanRequired: boolean;
}

export function aggregateProgress(tracker: Tracker): AggregatedProgress {
  const features = {
    total: 0,
    done: 0,
    active: 0,
    blocked: 0,
    replanRequired: 0,
    pending: 0,
  };

  for (const feature of tracker.features) {
    features.total += 1;
    switch (feature.status) {
      case FEATURE_STATUSES.done:
        features.done += 1;
        break;
      case FEATURE_STATUSES.implementationInProgress:
        features.active += 1;
        break;
      case FEATURE_STATUSES.replanRequired:
        features.replanRequired += 1;
        break;
      case FEATURE_STATUSES.draft:
      case FEATURE_STATUSES.inReview:
      case FEATURE_STATUSES.awaitingConfirmation:
      case FEATURE_STATUSES.implementationReady:
        features.pending += 1;
        break;
      default:
        features.pending += 1;
    }
  }

  const tasks = { total: 0, done: 0, inProgress: 0, blocked: 0, pending: 0 };

  for (const task of tracker.features.flatMap((f) => f.tasks)) {
    tasks.total += 1;
    switch (task.status) {
      case TASK_STATUSES.done:
        tasks.done += 1;
        break;
      case TASK_STATUSES.inProgress:
        tasks.inProgress += 1;
        break;
      case TASK_STATUSES.blocked:
        tasks.blocked += 1;
        break;
      default:
        tasks.pending += 1;
    }
  }

  const activeChangeRequests = tracker.workflow.activeChangeRequestId ? 1 : 0;

  return {
    workflowState: tracker.workflow.state,
    features,
    tasks,
    changeRequests: {
      total: tracker.changeRequests.length,
      active: activeChangeRequests,
    },
    hasBlockers: features.blocked > 0 || tasks.blocked > 0,
    hasReplanRequired: features.replanRequired > 0,
  };
}

export function formatAggregatedProgress(progress: AggregatedProgress): string {
  const lines: string[] = [
    `Workflow: ${progress.workflowState}`,
    "",
    "## Features",
    `  Total:            ${progress.features.total}`,
    `  Done:             ${progress.features.done}`,
    `  Active:           ${progress.features.active}`,
    `  Pending:          ${progress.features.pending}`,
    `  Blocked:          ${progress.features.blocked}`,
    `  Replan Required:  ${progress.features.replanRequired}`,
    "",
    "## Tasks",
    `  Total:       ${progress.tasks.total}`,
    `  Done:        ${progress.tasks.done}`,
    `  In Progress: ${progress.tasks.inProgress}`,
    `  Pending:     ${progress.tasks.pending}`,
    `  Blocked:     ${progress.tasks.blocked}`,
  ];

  if (progress.changeRequests.total > 0) {
    lines.push(
      "",
      "## Change Requests",
      `  Total:  ${progress.changeRequests.total}`,
      `  Active: ${progress.changeRequests.active}`,
    );
  }

  if (progress.hasBlockers) {
    lines.push("", "⚠️  Blocked items require attention before proceeding.");
  }

  if (progress.hasReplanRequired) {
    lines.push("", "⚠️  Some features are marked replan_required and need re-specification.");
  }

  return lines.join("\n");
}

// ── Legacy summarizeTracker (kept for backward compatibility) ─────────────────

export function summarizeTracker(tracker: Tracker): string {
  return formatAggregatedProgress(aggregateProgress(tracker));
}

// ── syncOpenSpecStatus (kept for tool compatibility) ─────────────────────────

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
