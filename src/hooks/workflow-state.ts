import type { PluginInput } from "@opencode-ai/plugin";

import { loadMergedConfig, readSessionState, writeSessionState } from "@/store";
import { WORKFLOW_STATES } from "@/utils/constants";
import { extractErrorMessage } from "@/utils/errors";

export function createWorkflowStateHook(ctx: PluginInput) {
  return {
    async validateWorkspaceConfig(sessionID: string): Promise<string | null> {
      try {
        await loadMergedConfig(ctx.directory);
        const session = await readSessionState(ctx.directory);
        session.updatedAt = new Date().toISOString();
        if (!session.workflowState) {
          session.workflowState = WORKFLOW_STATES.projectDiscovery;
        }
        await writeSessionState(ctx.directory, session);
        return null;
      } catch (error) {
        return `PRD harness config validation failed for session ${sessionID}: ${extractErrorMessage(error)}`;
      }
    },
  };
}
