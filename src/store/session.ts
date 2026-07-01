import { type SessionState, sessionStateSchema } from "@/schemas/tracker";
import { readValidatedYaml, writeValidatedYaml } from "@/store/base";
import { SESSION_PATH, WORKFLOW_STATES } from "@/utils/constants";
import { resolveWorkspacePath } from "@/utils/paths";

function createDefaultSession(): SessionState {
  return sessionStateSchema.parse({
    workflowState: WORKFLOW_STATES.projectDiscovery,
    updatedAt: new Date().toISOString(),
  });
}

export async function readSessionState(root: string): Promise<SessionState> {
  return readValidatedYaml(resolveWorkspacePath(root, SESSION_PATH), sessionStateSchema, createDefaultSession());
}

export async function writeSessionState(root: string, state: SessionState): Promise<void> {
  await writeValidatedYaml(resolveWorkspacePath(root, SESSION_PATH), sessionStateSchema, state);
}
