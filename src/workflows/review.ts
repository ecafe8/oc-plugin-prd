import { documentReviewRules, globalReviewRules } from "@/prompts/review-rules";
import type { ReviewRecord } from "@/schemas/review";
import { REVIEW_STATUSES } from "@/utils/constants";

function createCheckMap(value: "pass" | "warning"): Record<string, "pass" | "warning"> {
  return Object.fromEntries(globalReviewRules.map((key) => [key, value])) as Record<string, "pass" | "warning">;
}

function createDocumentCheckMap(value: "pass" | "warning"): Record<string, "pass" | "warning"> {
  return Object.fromEntries(Object.keys(documentReviewRules).map((key) => [key, value])) as Record<
    string,
    "pass" | "warning"
  >;
}

export function createPendingReview(summary: string): ReviewRecord {
  const qualityGates = createCheckMap("warning");

  return {
    decision: {
      status: REVIEW_STATUSES.changesRequested,
      updatedAt: new Date().toISOString(),
    },
    summary,
    qualityGates,
    documentChecks: createDocumentCheckMap("warning"),
  };
}

export function createApprovedReview(summary: string): ReviewRecord {
  const qualityGates = createCheckMap("pass");

  return {
    decision: {
      status: REVIEW_STATUSES.approved,
      updatedAt: new Date().toISOString(),
    },
    summary,
    qualityGates,
    documentChecks: createDocumentCheckMap("pass"),
  };
}
