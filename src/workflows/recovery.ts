import type { Tracker, TrackerFeature } from "@/schemas/tracker";
import { FEATURE_STATUSES, TASK_STATUSES, WORKFLOW_STATES } from "@/utils/constants";

// ── Re-entry path definitions ─────────────────────────────────────────────────

export interface ReentryPath {
  workflowState: string;
  featureState: string;
  preservedArtifacts: readonly string[];
  revisitArtifacts: readonly string[];
  description: string;
}

export const REENTRY_PATHS = {
  rejectedReview: {
    workflowState: WORKFLOW_STATES.featureReview,
    featureState: FEATURE_STATUSES.inReview,
    preservedArtifacts: ["01-foundation.md", "02-product.md", "03-ui-ux.md", "04-technical.md"],
    revisitArtifacts: ["review.yaml"],
    description:
      "Feature returned to revision. Existing document artifacts are preserved. A new review iteration is required before the feature can advance.",
  },
  replanRequired: {
    workflowState: WORKFLOW_STATES.replanRequired,
    featureState: FEATURE_STATUSES.replanRequired,
    preservedArtifacts: ["01-foundation.md", "02-product.md", "review.yaml"],
    revisitArtifacts: ["05-plan.md"],
    description:
      "Feature requires replanning. Foundation and product documents are preserved. The implementation plan must be regenerated after scope changes are applied.",
  },
} as const;

export type ReentryScenario = keyof typeof REENTRY_PATHS;

// ── Route functions ───────────────────────────────────────────────────────────

export function routeRejectedReview(tracker: Tracker, featureId: string): Tracker {
  const next = structuredClone(tracker);
  const feature = next.features.find((f) => f.id === featureId);
  if (!feature) return next;

  feature.status = FEATURE_STATUSES.inReview;
  next.workflow.state = WORKFLOW_STATES.featureReview;
  next.workflow.updatedAt = new Date().toISOString();

  return next;
}

export function routeReplanRequired(tracker: Tracker, featureId: string): Tracker {
  const next = structuredClone(tracker);
  const feature = next.features.find((f) => f.id === featureId);
  if (!feature) return next;

  feature.status = FEATURE_STATUSES.replanRequired;
  next.workflow.state = WORKFLOW_STATES.replanRequired;
  next.workflow.updatedAt = new Date().toISOString();

  return next;
}

// ── Re-entry description ──────────────────────────────────────────────────────

export function describeReentryPath(scenario: ReentryScenario): ReentryPath {
  return REENTRY_PATHS[scenario];
}

export function formatReentryGuidance(scenario: ReentryScenario, featureId: string): string {
  const reentryPath = REENTRY_PATHS[scenario];
  const preserved = reentryPath.preservedArtifacts.map((a) => `  - ${a}`).join("\n");
  const revisit = reentryPath.revisitArtifacts.map((a) => `  - ${a}`).join("\n");

  return [
    `Re-entry path for ${featureId}: ${scenario}`,
    "",
    reentryPath.description,
    "",
    "Preserved artifacts:",
    preserved,
    "",
    "Must revisit:",
    revisit,
  ].join("\n");
}

// ── Plan generation guard ─────────────────────────────────────────────────────

export function canRegeneratePlan(feature: TrackerFeature): { allowed: boolean; reason?: string } {
  if (feature.status === FEATURE_STATUSES.implementationInProgress) {
    const startedCount = feature.tasks.filter((t) => t.status !== TASK_STATUSES.pending).length;
    return {
      allowed: false,
      reason: `Feature ${feature.id} is already in progress (${startedCount} task(s) started or done). Regenerating the plan would overwrite active task progress. Use change_request_apply to record a scope change instead.`,
    };
  }
  if (feature.status === FEATURE_STATUSES.done) {
    return {
      allowed: false,
      reason: `Feature ${feature.id} is already complete. No plan regeneration is needed.`,
    };
  }
  return { allowed: true };
}
