import { type PendingCandidateSet, pendingCandidateSetSchema } from "@/schemas/candidate";
import { readValidatedYaml, writeValidatedYaml } from "@/store/base";
import { CANDIDATES_PATH } from "@/utils/constants";
import { resolveWorkspacePath } from "@/utils/paths";

function createDefaultCandidateSet(): PendingCandidateSet {
  return pendingCandidateSetSchema.parse({
    generatedAt: new Date().toISOString(),
    candidates: [],
  });
}

export async function readPendingCandidates(root: string): Promise<PendingCandidateSet> {
  return readValidatedYaml(
    resolveWorkspacePath(root, CANDIDATES_PATH),
    pendingCandidateSetSchema,
    createDefaultCandidateSet(),
  );
}

export async function writePendingCandidates(root: string, set: PendingCandidateSet): Promise<void> {
  await writeValidatedYaml(resolveWorkspacePath(root, CANDIDATES_PATH), pendingCandidateSetSchema, set);
}
