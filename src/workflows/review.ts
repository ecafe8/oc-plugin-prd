import { documentReviewRules, globalReviewRules } from "@/prompts/review-rules";
import type { ReviewRecord } from "@/schemas/review";
import { REVIEW_STATUSES } from "@/utils/constants";

export interface ReviewLimits {
  maxIterations: number;
  escalationAfter: number;
}

const DEFAULT_REVIEW_LIMITS: ReviewLimits = {
  maxIterations: 3,
  escalationAfter: 3,
};

function createCheckMap(value: "pass" | "warning"): Record<string, "pass" | "warning"> {
  return Object.fromEntries(globalReviewRules.map((key) => [key, value])) as Record<string, "pass" | "warning">;
}

function createDocumentCheckMap(value: "pass" | "warning"): Record<string, "pass" | "warning"> {
  return Object.fromEntries(Object.keys(documentReviewRules).map((key) => [key, value])) as Record<
    string,
    "pass" | "warning"
  >;
}

export function createPendingReview(summary: string, limits: ReviewLimits = DEFAULT_REVIEW_LIMITS): ReviewRecord {
  const qualityGates = createCheckMap("warning");

  return {
    decision: {
      status: REVIEW_STATUSES.changesRequested,
      updatedAt: new Date().toISOString(),
    },
    summary,
    qualityGates,
    documentChecks: createDocumentCheckMap("warning"),
    history: [],
    loopState: {
      retryCount: 0,
      retryThreshold: limits.escalationAfter,
      maxIterations: limits.maxIterations,
      escalationAfter: limits.escalationAfter,
      escalated: false,
      hasContradiction: false,
    },
  };
}

export function createApprovedReview(summary: string, limits: ReviewLimits = DEFAULT_REVIEW_LIMITS): ReviewRecord {
  const qualityGates = createCheckMap("pass");

  return {
    decision: {
      status: REVIEW_STATUSES.approved,
      updatedAt: new Date().toISOString(),
    },
    summary,
    qualityGates,
    documentChecks: createDocumentCheckMap("pass"),
    history: [],
    loopState: {
      retryCount: 0,
      retryThreshold: limits.escalationAfter,
      maxIterations: limits.maxIterations,
      escalationAfter: limits.escalationAfter,
      escalated: false,
      hasContradiction: false,
    },
  };
}
