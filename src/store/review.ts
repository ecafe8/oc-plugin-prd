import path from "node:path";

import { type ReviewRecord, reviewRecordSchema } from "@/schemas/review";
import { readValidatedYaml, writeValidatedYaml } from "@/store/base";
import { REVIEW_STATUSES, REVIEWS_DIR } from "@/utils/constants";
import { resolveWorkspacePath } from "@/utils/paths";

function createDefaultReview(): ReviewRecord {
  return reviewRecordSchema.parse({
    decision: {
      status: REVIEW_STATUSES.notReviewed,
      updatedAt: new Date().toISOString(),
    },
  });
}

export async function readReview(root: string, reviewPath: string): Promise<ReviewRecord> {
  return readValidatedYaml(resolveWorkspacePath(root, reviewPath), reviewRecordSchema, createDefaultReview());
}

export async function writeReview(root: string, reviewPath: string, review: ReviewRecord): Promise<void> {
  await writeValidatedYaml(resolveWorkspacePath(root, reviewPath), reviewRecordSchema, review);
}

export async function writeReviewIndex(root: string, reviewName: string, review: ReviewRecord): Promise<void> {
  const filePath = resolveWorkspacePath(root, path.join(REVIEWS_DIR, `${reviewName}.yaml`));
  await writeValidatedYaml(filePath, reviewRecordSchema, review);
}
