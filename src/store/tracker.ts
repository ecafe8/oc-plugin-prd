import { type Tracker, trackerSchema } from "@/schemas/tracker";
import { readValidatedYaml, writeValidatedYaml } from "@/store/base";
import { TRACKER_PATH, WORKFLOW_STATES } from "@/utils/constants";
import { resolveWorkspacePath } from "@/utils/paths";

function createDefaultTracker(): Tracker {
  return trackerSchema.parse({
    workflow: {
      state: WORKFLOW_STATES.projectDiscovery,
      updatedAt: new Date().toISOString(),
    },
    project: {},
    authoring: {},
    features: [],
    changeRequests: [],
  });
}

export async function readTracker(root: string): Promise<Tracker> {
  return readValidatedYaml(resolveWorkspacePath(root, TRACKER_PATH), trackerSchema, createDefaultTracker());
}

export async function writeTracker(root: string, tracker: Tracker): Promise<void> {
  await writeValidatedYaml(resolveWorkspacePath(root, TRACKER_PATH), trackerSchema, tracker);
}
