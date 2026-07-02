import type { Plugin } from "@opencode-ai/plugin";

import { agents } from "@/agents";
import { createWorkflowStateHook } from "@/hooks";
import {
  changeRequestApplyTool,
  discoveryCapturetool,
  discoveryStatusTool,
  discoveryUpdateTool,
  featureCandidatesGenerateTool,
  featureCandidatesMaterializeTool,
  featureReviewTool,
  featureSplitTool,
  masterPrdDraftTool,
  masterPrdGenerateTool,
  masterPrdReviewTool,
  masterPrdSubmitTool,
  openSpecSyncTool,
  openspecGenerateTool,
  planGenerateTool,
  progressSnapshotTool,
  projectDiscoverTool,
  reviewLoopContextTool,
  reviewLoopExecuteTool,
  switchModelTool,
} from "@/tools";

const prdToolNames = new Set([
  "discovery_capture",
  "discovery_update",
  "discovery_status",
  "project_discover",
  "master_prd_draft",
  "master_prd_generate",
  "master_prd_review",
  "master_prd_submit",
  "feature_candidates_generate",
  "feature_candidates_materialize",
  "feature_split",
  "feature_review",
  "plan_generate",
  "openspec_sync",
  "openspec_generate",
  "progress_snapshot",
  "change_request_apply",
  "review_loop_context",
  "review_loop_execute",
  "switch_model",
]);

export const OpenCodePrdPlugin: Plugin = async (ctx) => {
  const workflowStateHook = createWorkflowStateHook(ctx);

  return {
    tool: {
      discovery_capture: discoveryCapturetool,
      discovery_update: discoveryUpdateTool,
      discovery_status: discoveryStatusTool,
      project_discover: projectDiscoverTool,
      master_prd_draft: masterPrdDraftTool,
      master_prd_generate: masterPrdGenerateTool,
      master_prd_review: masterPrdReviewTool,
      master_prd_submit: masterPrdSubmitTool,
      feature_candidates_generate: featureCandidatesGenerateTool,
      feature_candidates_materialize: featureCandidatesMaterializeTool,
      feature_split: featureSplitTool,
      feature_review: featureReviewTool,
      plan_generate: planGenerateTool,
      openspec_sync: openSpecSyncTool,
      openspec_generate: openspecGenerateTool,
      progress_snapshot: progressSnapshotTool,
      change_request_apply: changeRequestApplyTool,
      review_loop_context: reviewLoopContextTool,
      review_loop_execute: reviewLoopExecuteTool,
      switch_model: switchModelTool,
    },

    config: async (config) => {
      config.permission = {
        ...config.permission,
        edit: "allow",
        bash: "allow",
      };

      config.agent = {
        ...config.agent,
        ...agents,
      };
    },

    "tool.execute.before": async (input) => {
      if (!prdToolNames.has(input.tool)) {
        return;
      }

      const error = await workflowStateHook.validateWorkspaceConfig(input.sessionID);
      if (error) {
        throw new Error(error);
      }
    },
  };
};
