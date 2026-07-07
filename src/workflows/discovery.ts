import type { DiscoveryContext } from "@/schemas/discovery";
import type { Tracker } from "@/schemas/tracker";

const REQUIRED_FIELDS: Array<keyof Pick<DiscoveryContext, "goal" | "actors" | "successMeasures">> = [
  "goal",
  "actors",
  "successMeasures",
];

export interface ReadinessResult {
  ready: boolean;
  missingFields: string[];
  openQuestionsCount: number;
}

export function checkDiscoveryReadiness(ctx: DiscoveryContext, openQuestionsCount: number): ReadinessResult {
  const missingFields: string[] = [];

  if (!ctx.goal.trim()) {
    missingFields.push("goal");
  }

  if (ctx.actors.length === 0) {
    missingFields.push("actors (or mark as unknown)");
  }

  if (ctx.successMeasures.length === 0) {
    missingFields.push("successMeasures (or mark as provisional)");
  }

  return {
    ready: missingFields.length === 0,
    missingFields,
    openQuestionsCount,
  };
}

/** Compares two string arrays as unordered sets (order-insensitive, duplicate-insensitive). */
function sameStringSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const setA = new Set(a);
  return b.every((value) => setA.has(value));
}

export function mergeDiscoveryContext(existing: DiscoveryContext, patch: Partial<DiscoveryContext>): DiscoveryContext {
  const goal = patch.goal ?? existing.goal;
  const actors = patch.actors ? [...new Set([...existing.actors, ...patch.actors])] : existing.actors;
  const constraints = patch.constraints
    ? [...new Set([...existing.constraints, ...patch.constraints])]
    : existing.constraints;
  const assumptions = patch.assumptions
    ? [...new Set([...existing.assumptions, ...patch.assumptions])]
    : existing.assumptions;
  const successMeasures = patch.successMeasures
    ? [...new Set([...existing.successMeasures, ...patch.successMeasures])]
    : existing.successMeasures;

  // Only reset confirmation when the merge actually changes stored content —
  // a no-op update (e.g. re-adding an actor that already exists) should not
  // silently revoke a prior explicit confirmation.
  const contentChanged =
    goal !== existing.goal ||
    !sameStringSet(actors, existing.actors) ||
    !sameStringSet(constraints, existing.constraints) ||
    !sameStringSet(assumptions, existing.assumptions) ||
    !sameStringSet(successMeasures, existing.successMeasures);

  return {
    ...existing,
    goal,
    actors,
    constraints,
    assumptions,
    successMeasures,
    // Any actual change to core discovery content invalidates a prior explicit
    // confirmation, forcing a fresh `discovery_confirm` call before drafting
    // can proceed again.
    readyForDrafting: contentChanged ? false : (patch.readyForDrafting ?? existing.readyForDrafting),
    updatedAt: new Date().toISOString(),
  };
}

// ── Drafting confirmation gate ────────────────────────────────────────────────

export type DraftingReadinessState = "fields_incomplete" | "pending_confirmation" | "confirmed";

/**
 * Computes the tri-state drafting readiness:
 *   - fields_incomplete   — required discovery fields are still missing
 *   - pending_confirmation — required fields are present but the user has not
 *                            yet explicitly confirmed via `discovery_confirm`
 *   - confirmed           — required fields are present and confirmation was granted
 */
export function computeDraftingReadinessState(
  ctx: DiscoveryContext,
  openQuestionsCount: number,
): DraftingReadinessState {
  const readiness = checkDiscoveryReadiness(ctx, openQuestionsCount);
  if (!readiness.ready) {
    return "fields_incomplete";
  }
  return ctx.readyForDrafting ? "confirmed" : "pending_confirmation";
}

/** True only when required fields are present AND discovery has been explicitly confirmed. */
export function isConfirmedReadyForDrafting(ctx: DiscoveryContext, openQuestionsCount: number): boolean {
  return computeDraftingReadinessState(ctx, openQuestionsCount) === "confirmed";
}

export function applyAuthoringMeta(tracker: Tracker, patch: Partial<Tracker["authoring"]>): Tracker {
  return {
    ...tracker,
    authoring: {
      ...tracker.authoring,
      ...patch,
    },
  };
}

export function formatDiscoverySummary(ctx: DiscoveryContext): string {
  return [
    "# Discovery Summary",
    "",
    "## Goal",
    "",
    ctx.goal || "_Not yet captured._",
    "",
    "## Actors",
    "",
    ctx.actors.length > 0 ? ctx.actors.map((a) => `- ${a}`).join("\n") : "_Not yet identified._",
    "",
    "## Constraints",
    "",
    ctx.constraints.length > 0 ? ctx.constraints.map((c) => `- ${c}`).join("\n") : "_None specified._",
    "",
    "## Assumptions",
    "",
    ctx.assumptions.length > 0 ? ctx.assumptions.map((a) => `- ${a}`).join("\n") : "_None specified._",
    "",
    "## Success Measures",
    "",
    ctx.successMeasures.length > 0 ? ctx.successMeasures.map((s) => `- ${s}`).join("\n") : "_Not yet defined._",
  ].join("\n");
}
