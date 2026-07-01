import type { Plugin } from "@opencode-ai/plugin";

import { agents } from "@/agents";
import { createWorkflowStateHook } from "@/hooks";
import {
  changeRequestApplyTool,
  featureReviewTool,
  featureSplitTool,
  masterPrdGenerateTool,
  masterPrdReviewTool,
  openSpecSyncTool,
  planGenerateTool,
  progressSnapshotTool,
  projectDiscoverTool,
} from "@/tools";

const prdToolNames = new Set([
  "project_discover",
  "master_prd_generate",
  "master_prd_review",
  "feature_split",
  "feature_review",
  "plan_generate",
  "openspec_sync",
  "progress_snapshot",
  "change_request_apply",
]);

export const OpenCodePrdPlugin: Plugin = async (ctx) => {
  const workflowStateHook = createWorkflowStateHook(ctx);

  return {
    tool: {
      project_discover: projectDiscoverTool,
      master_prd_generate: masterPrdGenerateTool,
      master_prd_review: masterPrdReviewTool,
      feature_split: featureSplitTool,
      feature_review: featureReviewTool,
      plan_generate: planGenerateTool,
      openspec_sync: openSpecSyncTool,
      progress_snapshot: progressSnapshotTool,
      change_request_apply: changeRequestApplyTool,
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
