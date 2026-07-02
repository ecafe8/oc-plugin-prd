import { resolveModelForRole } from "@/adapters/model-selector";
import type { VibeConfig } from "@/schemas/config";
import type { DiscoveryContext } from "@/schemas/discovery";
import type { Tracker } from "@/schemas/tracker";
import { MASTER_PRD_PATH, WORKFLOW_STATES } from "@/utils/constants";
import { readText } from "@/utils/fs";
import { resolveWorkspacePath } from "@/utils/paths";

export interface AuthoringContext {
  discoveryContext: DiscoveryContext;
  discoverySummary: string;
  existingDraft: string | null;
  workflowState: string;
  projectTitle: string;
  draftingModel: string | undefined;
}

export async function assembleAuthoringContext(
  root: string,
  tracker: Tracker,
  discoveryContext: DiscoveryContext,
  discoverySummary: string,
  config: VibeConfig,
): Promise<AuthoringContext> {
  const existingDraft = await readText(resolveWorkspacePath(root, MASTER_PRD_PATH));

  return {
    discoveryContext,
    discoverySummary,
    existingDraft,
    workflowState: tracker.workflow.state,
    projectTitle: tracker.project.title,
    draftingModel: resolveModelForRole(config, "drafting"),
  };
}

export function formatAuthoringPrompt(ctx: AuthoringContext): string {
  const sections: string[] = [
    "# Master PRD Authoring Context",
    "",
    `**Workflow state:** ${ctx.workflowState}`,
    `**Drafting model:** ${ctx.draftingModel ?? "OpenCode default"}`,
    "",
    "## Discovery Summary",
    "",
    ctx.discoverySummary || "_No discovery summary available._",
    "",
    "## Structured Discovery Context",
    "",
    `**Goal:** ${ctx.discoveryContext.goal || "_Not captured._"}`,
    "",
    `**Actors:** ${ctx.discoveryContext.actors.length > 0 ? ctx.discoveryContext.actors.join(", ") : "_Unknown._"}`,
    "",
    `**Constraints:** ${ctx.discoveryContext.constraints.length > 0 ? ctx.discoveryContext.constraints.join(", ") : "_None._"}`,
    "",
    `**Assumptions:** ${ctx.discoveryContext.assumptions.length > 0 ? ctx.discoveryContext.assumptions.join(", ") : "_None._"}`,
    "",
    `**Success Measures:** ${ctx.discoveryContext.successMeasures.length > 0 ? ctx.discoveryContext.successMeasures.join(", ") : "_Not defined._"}`,
  ];

  if (ctx.existingDraft) {
    sections.push("", "## Existing Draft (for revision)", "", ctx.existingDraft);
  }

  return sections.join("\n");
}

export function advanceToMasterPrdDrafting(tracker: Tracker): Tracker {
  const now = new Date().toISOString();
  return {
    ...tracker,
    workflow: {
      ...tracker.workflow,
      state: WORKFLOW_STATES.masterPrdDrafting,
      updatedAt: now,
    },
    authoring: {
      ...tracker.authoring,
      discoveryReady: true,
      lastDiscoveryUpdate: tracker.authoring.lastDiscoveryUpdate ?? now,
    },
  };
}

export function advanceToMasterPrdReview(tracker: Tracker): Tracker {
  const now = new Date().toISOString();
  return {
    ...tracker,
    workflow: {
      ...tracker.workflow,
      state: WORKFLOW_STATES.masterPrdReview,
      updatedAt: now,
    },
    authoring: {
      ...tracker.authoring,
      lastMasterPrdDraft: now,
    },
  };
}

export function routeBackToDrafting(tracker: Tracker): Tracker {
  const now = new Date().toISOString();
  return {
    ...tracker,
    workflow: {
      ...tracker.workflow,
      state: WORKFLOW_STATES.masterPrdDrafting,
      updatedAt: now,
    },
  };
}
