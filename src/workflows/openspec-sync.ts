import { readOpenSpecTaskStatus, writeOpenSpecChange } from "@/adapters/openspec";
import type { Tracker, TrackerFeature } from "@/schemas/tracker";
import { FEATURE_STATUSES, TASK_STATUSES } from "@/utils/constants";

export interface SyncConflict {
  taskId: string;
  trackerStatus: string;
  openSpecDone: boolean;
}

// ── Outcome classification ────────────────────────────────────────────────────

/**
 * Structured sync outcome type:
 *   no_op        — tracker and OpenSpec already agree, no writes needed
 *   safe_update  — OpenSpec has completed tasks tracker doesn't know about yet; safe to apply
 *   conflict     — tracker has tasks marked done that OpenSpec still shows pending; tracker wins
 *                  but OpenSpec needs manual reconciliation
 *   manual_follow_up — conflicts are present alongside safe updates; operator review required
 *                      before further sync
 */
export type SyncOutcomeKind = "no_op" | "safe_update" | "conflict" | "manual_follow_up";

export interface SyncResult {
  noOp: boolean;
  conflicts: SyncConflict[];
  updatedTaskIds: string[];
  outcomeKind: SyncOutcomeKind;
  repairGuidance: string[];
}

// ── Outcome helpers ───────────────────────────────────────────────────────────

function classifyOutcome(noOp: boolean, conflicts: SyncConflict[], updatedTaskIds: string[]): SyncOutcomeKind {
  if (noOp) return "no_op";
  if (conflicts.length > 0 && updatedTaskIds.length > 0) return "manual_follow_up";
  if (conflicts.length > 0) return "conflict";
  return "safe_update";
}

function buildRepairGuidance(conflicts: SyncConflict[], featureId: string): string[] {
  if (conflicts.length === 0) return [];

  const guidance: string[] = [
    `${conflicts.length} task(s) are marked done in the tracker but still pending in the OpenSpec artifact.`,
    `The tracker remains authoritative — no tracker state was changed.`,
    `To reconcile, open openspec/changes/${featureId}.md and mark the following task(s) as done:`,
    ...conflicts.map((c) => `  - [ ] → [x]  ${c.taskId}`),
    `Then rerun openspec_sync to confirm alignment.`,
  ];

  return guidance;
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
    return { noOp: true, conflicts: [], updatedTaskIds: [], outcomeKind: "no_op", repairGuidance: [] };
  }

  const conflicts: SyncConflict[] = [];
  const updatedTaskIds: string[] = [];

  for (const task of feature.tasks) {
    const openSpecDone = openSpecStatuses.get(task.id);
    if (openSpecDone === undefined) continue;

    const trackerDone = task.status === TASK_STATUSES.done;

    if (openSpecDone !== trackerDone) {
      if (openSpecDone) {
        // OpenSpec says done but tracker disagrees → safe to update tracker
        updatedTaskIds.push(task.id);
      } else {
        // Tracker says done but OpenSpec says not → conflict (tracker wins)
        conflicts.push({ taskId: task.id, trackerStatus: task.status, openSpecDone });
      }
    }
  }

  const noOp = updatedTaskIds.length === 0 && conflicts.length === 0;
  const outcomeKind = classifyOutcome(noOp, conflicts, updatedTaskIds);
  const repairGuidance = buildRepairGuidance(conflicts, feature.id);

  return { noOp, conflicts, updatedTaskIds, outcomeKind, repairGuidance };
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

  const lines: string[] = [`Sync result for ${featureId} [${result.outcomeKind}]:`];

  if (result.updatedTaskIds.length > 0) {
    lines.push(`  Safe update — applied ${result.updatedTaskIds.length} task(s) from OpenSpec to tracker:`);
    lines.push(`  ${result.updatedTaskIds.join(", ")}`);
  }

  if (result.conflicts.length > 0) {
    lines.push(`  Conflicts (tracker authoritative — ${result.conflicts.length} task(s) need manual OpenSpec update):`);
    for (const conflict of result.conflicts) {
      lines.push(`    ${conflict.taskId}: tracker=${conflict.trackerStatus}, openspec=pending`);
    }
  }

  if (result.repairGuidance.length > 0) {
    lines.push("", "  Repair guidance:");
    for (const line of result.repairGuidance) {
      lines.push(`  ${line}`);
    }
  }

  return lines.join("\n");
}
