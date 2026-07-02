import { readOpenSpecTaskStatus, writeOpenSpecChange } from "@/adapters/openspec";
import type { Tracker, TrackerFeature } from "@/schemas/tracker";
import { FEATURE_STATUSES, TASK_STATUSES } from "@/utils/constants";

export interface SyncConflict {
  taskId: string;
  trackerStatus: string;
  openSpecDone: boolean;
}

export interface SyncResult {
  noOp: boolean;
  conflicts: SyncConflict[];
  updatedTaskIds: string[];
}

// ── Generate / update OpenSpec change ────────────────────────────────────────

export async function generateFeatureOpenSpecChange(
  root: string,
  feature: TrackerFeature,
): Promise<{ path: string; isUpdate: boolean }> {
  return writeOpenSpecChange(root, feature);
}

export function markFeatureImplementationReady(feature: TrackerFeature): TrackerFeature {
  return { ...feature, status: FEATURE_STATUSES.implementationReady };
}

// ── Sync: compare OpenSpec ↔ tracker, preserve tracker authority ──────────────

export async function computeSyncResult(root: string, feature: TrackerFeature): Promise<SyncResult> {
  const openSpecStatuses = await readOpenSpecTaskStatus(root, feature.id);

  if (openSpecStatuses.size === 0) {
    return { noOp: true, conflicts: [], updatedTaskIds: [] };
  }

  const conflicts: SyncConflict[] = [];
  const updatedTaskIds: string[] = [];

  for (const task of feature.tasks) {
    const openSpecDone = openSpecStatuses.get(task.id);
    if (openSpecDone === undefined) continue;

    const trackerDone = task.status === TASK_STATUSES.done;

    if (openSpecDone !== trackerDone) {
      if (openSpecDone) {
        // OpenSpec says done but tracker disagrees → update tracker
        updatedTaskIds.push(task.id);
      } else {
        // Tracker says done but OpenSpec says not → conflict (tracker wins)
        conflicts.push({ taskId: task.id, trackerStatus: task.status, openSpecDone });
      }
    }
  }

  const noOp = updatedTaskIds.length === 0 && conflicts.length === 0;
  return { noOp, conflicts, updatedTaskIds };
}

export function applyOpenSpecSync(tracker: Tracker, featureId: string, updatedTaskIds: string[]): Tracker {
  if (updatedTaskIds.length === 0) return tracker;

  const next = structuredClone(tracker);
  const feature = next.features.find((f) => f.id === featureId);
  if (!feature) return next;

  const doneSet = new Set(updatedTaskIds);
  feature.tasks = feature.tasks.map((task) => (doneSet.has(task.id) ? { ...task, status: TASK_STATUSES.done } : task));

  // Update feature status if all tasks are now done
  if (feature.tasks.length > 0 && feature.tasks.every((t) => t.status === TASK_STATUSES.done)) {
    feature.status = FEATURE_STATUSES.done;
  }

  next.workflow.updatedAt = new Date().toISOString();
  return next;
}

export function formatSyncResult(result: SyncResult, featureId: string): string {
  if (result.noOp) {
    return `Sync: no changes required for ${featureId} — tracker and OpenSpec already agree.`;
  }

  const lines: string[] = [`Sync result for ${featureId}:`];

  if (result.updatedTaskIds.length > 0) {
    lines.push(`  Updated to done: ${result.updatedTaskIds.join(", ")}`);
  }

  if (result.conflicts.length > 0) {
    lines.push(`  Conflicts (tracker wins):`);
    for (const conflict of result.conflicts) {
      lines.push(`    ${conflict.taskId}: tracker=${conflict.trackerStatus}, openspec=done — tracker is authoritative`);
    }
  }

  return lines.join("\n");
}
