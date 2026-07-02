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

export function mergeDiscoveryContext(existing: DiscoveryContext, patch: Partial<DiscoveryContext>): DiscoveryContext {
  return {
    ...existing,
    goal: patch.goal ?? existing.goal,
    actors: patch.actors ? [...new Set([...existing.actors, ...patch.actors])] : existing.actors,
    constraints: patch.constraints
      ? [...new Set([...existing.constraints, ...patch.constraints])]
      : existing.constraints,
    assumptions: patch.assumptions
      ? [...new Set([...existing.assumptions, ...patch.assumptions])]
      : existing.assumptions,
    successMeasures: patch.successMeasures
      ? [...new Set([...existing.successMeasures, ...patch.successMeasures])]
      : existing.successMeasures,
    readyForDrafting: patch.readyForDrafting ?? existing.readyForDrafting,
    updatedAt: new Date().toISOString(),
  };
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
