import path from "node:path";

import { type ChangeRequestRecord, changeRequestRecordSchema } from "@/schemas/change-request";
import { readTracker, writeTracker } from "@/store/tracker";
import { CHANGES_DIR } from "@/utils/constants";
import { ensureDirectory, writeText } from "@/utils/fs";
import { changeDirectoryName, resolveWorkspacePath } from "@/utils/paths";

export async function createChangeRequest(
  root: string,
  record: ChangeRequestRecord,
  request: string,
): Promise<ChangeRequestRecord> {
  const parsed = changeRequestRecordSchema.parse(record);
  const directory = resolveWorkspacePath(
    root,
    path.join(CHANGES_DIR, changeDirectoryName(parsed.sequence, parsed.slug)),
  );

  await ensureDirectory(directory);
  await writeText(path.join(directory, "request.md"), request);
  await writeText(path.join(directory, "impact.md"), "# Impact\n\nPending impact analysis.");
  await writeText(path.join(directory, "decision.md"), "# Decision\n\nPending decision.");

  const tracker = await readTracker(root);
  tracker.changeRequests.push(parsed);
  tracker.workflow.activeChangeRequestId = parsed.id;
  tracker.workflow.updatedAt = new Date().toISOString();
  await writeTracker(root, tracker);

  return parsed;
}
