import { globalReviewRules } from "@/prompts/review-rules";
import type { ReviewIteration, ReviewRecord } from "@/schemas/review";
import { reviewIterationSchema } from "@/schemas/review";
import { REVIEW_STATUSES } from "@/utils/constants";

export const DEFAULT_RETRY_THRESHOLD = 3;

// ── Artifact type definition ─────────────────────────────────────────────────

export type ArtifactType = "master_prd" | "feature" | "plan";

// ── Pre-checks ───────────────────────────────────────────────────────────────

export interface PreCheckResult {
  blockers: string[];
  warnings: string[];
  passed: boolean;
}

const REQUIRED_HEADINGS_BY_TYPE: Record<ArtifactType, string[]> = {
  master_prd: ["Goals", "Users", "Scope"],
  feature: ["Foundation", "Product"],
  plan: ["Tasks"],
};

export function runPreChecks(content: string, artifactType: ArtifactType): PreCheckResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!content.trim()) {
    blockers.push("Document is empty");
    return { blockers, warnings, passed: false };
  }

  if (content.length < 100) {
    warnings.push("Document is unusually short (under 100 characters)");
  }

  const requiredHeadings = REQUIRED_HEADINGS_BY_TYPE[artifactType] ?? [];
  for (const heading of requiredHeadings) {
    const pattern = new RegExp(`#{1,4}\\s+${heading}`, "i");
    if (!pattern.test(content)) {
      warnings.push(`Expected section heading not found: "${heading}"`);
    }
  }

  // Check for placeholder text from templates
  const placeholders = ["_(to be filled in)_", "_Not yet captured._", "<!-- "];
  for (const placeholder of placeholders) {
    if (content.includes(placeholder)) {
      warnings.push(`Document may contain unfilled template placeholder: "${placeholder}"`);
    }
  }

  return {
    blockers,
    warnings,
    passed: blockers.length === 0,
  };
}

// ── Iteration management ─────────────────────────────────────────────────────

export function createReviewIteration(
  record: ReviewRecord,
  status: string,
  summary: string,
  blockers: string[],
  warnings: string[],
  reviewModel?: string,
): ReviewIteration {
  const nextIteration = record.history.length + 1;
  return reviewIterationSchema.parse({
    iteration: nextIteration,
    status,
    summary,
    blockers,
    warnings,
    timestamp: new Date().toISOString(),
    reviewModel,
  });
}

export function appendIteration(record: ReviewRecord, iteration: ReviewIteration): ReviewRecord {
  const isFailure =
    iteration.status === REVIEW_STATUSES.changesRequested || iteration.status === REVIEW_STATUSES.blocked;

  return {
    ...record,
    decision: {
      status: iteration.status as ReviewRecord["decision"]["status"],
      updatedAt: iteration.timestamp,
    },
    summary: iteration.summary,
    history: [...record.history, iteration],
    loopState: {
      ...record.loopState,
      retryCount: isFailure ? record.loopState.retryCount + 1 : record.loopState.retryCount,
    },
  };
}

// ── Escalation ───────────────────────────────────────────────────────────────

export function checkEscalationNeeded(record: ReviewRecord): boolean {
  return record.loopState.retryCount >= record.loopState.escalationAfter && !record.loopState.escalated;
}

export function isReviewBudgetExhausted(record: ReviewRecord): boolean {
  return record.history.length >= record.loopState.maxIterations;
}

export function escalateReview(record: ReviewRecord, reason: string): ReviewRecord {
  return {
    ...record,
    decision: {
      status: REVIEW_STATUSES.blocked,
      updatedAt: new Date().toISOString(),
    },
    loopState: {
      ...record.loopState,
      escalated: true,
      blockedReason: reason,
    },
  };
}

export function markContradiction(record: ReviewRecord, details: string): ReviewRecord {
  return {
    ...record,
    decision: {
      status: REVIEW_STATUSES.blocked,
      updatedAt: new Date().toISOString(),
    },
    loopState: {
      ...record.loopState,
      hasContradiction: true,
      blockedReason: details,
    },
  };
}

// ── Context assembly ─────────────────────────────────────────────────────────

export interface ReviewContext {
  artifactType: ArtifactType;
  artifactContent: string;
  preCheckResult: PreCheckResult;
  previousHistory: ReviewIteration[];
  reviewModel: string | undefined;
  reviewRules: readonly string[];
  maxIterations: number;
  escalationAfter: number;
}

export function assembleReviewContext(
  artifactType: ArtifactType,
  artifactContent: string,
  record: ReviewRecord,
  reviewModel: string | undefined,
): ReviewContext {
  return {
    artifactType,
    artifactContent,
    preCheckResult: runPreChecks(artifactContent, artifactType),
    previousHistory: record.history,
    reviewModel,
    reviewRules: globalReviewRules,
    maxIterations: record.loopState.maxIterations,
    escalationAfter: record.loopState.escalationAfter,
  };
}

export function formatReviewPrompt(ctx: ReviewContext): string {
  const {
    artifactType,
    artifactContent,
    preCheckResult,
    previousHistory,
    reviewModel,
    reviewRules,
    maxIterations,
    escalationAfter,
  } = ctx;

  const sections: string[] = [
    `# Review Context: ${artifactType.replace("_", " ").toUpperCase()}`,
    "",
    `**Review model:** ${reviewModel ?? "OpenCode default"}`,
    `**Iteration:** ${previousHistory.length + 1}`,
    `**Review budget:** ${previousHistory.length} / ${maxIterations} iterations used`,
    `**Escalation after:** ${escalationAfter} failed iterations`,
    "",
  ];

  if (preCheckResult.blockers.length > 0) {
    sections.push("## Pre-check Blockers (automatic)", "", ...preCheckResult.blockers.map((b) => `- ❌ ${b}`), "");
  }

  if (preCheckResult.warnings.length > 0) {
    sections.push("## Pre-check Warnings", "", ...preCheckResult.warnings.map((w) => `- ⚠️  ${w}`), "");
  }

  if (previousHistory.length > 0) {
    const last = previousHistory.at(-1);
    if (last) {
      sections.push(
        "## Previous Review Summary",
        "",
        `Last status: ${last.status} (iteration ${last.iteration})`,
        last.summary ? `Summary: ${last.summary}` : "",
        last.blockers.length > 0 ? `Blockers: ${last.blockers.join("; ")}` : "",
        "",
      );
    }
  }

  sections.push(
    "## Quality Gates to Evaluate",
    "",
    ...reviewRules.map((r) => `- ${r.replace(/_/g, " ")}`),
    "",
    "## Artifact Content",
    "",
    artifactContent,
    "",
    "## Instructions",
    "",
    "Evaluate the artifact against the quality gates above. Call `review_loop_execute` with:",
    "- `approved: true` if all blockers pass",
    "- `approved: false` if any blocking issues remain",
    "- `blockers`: list of specific blocking findings",
    "- `warnings`: list of advisory findings",
    "- `hasContradiction: true` if the artifact contradicts other project context",
  );

  return sections.filter((s) => s !== "").join("\n");
}

// ── User-facing summary ──────────────────────────────────────────────────────

export function formatReviewSummary(record: ReviewRecord): string {
  const lines: string[] = [
    `Review status: ${record.decision.status}`,
    `Total iterations: ${record.history.length}`,
    `Retry count: ${record.loopState.retryCount} / ${record.loopState.escalationAfter}`,
    `Iteration limit: ${record.history.length} / ${record.loopState.maxIterations}`,
  ];

  if (record.loopState.escalated) {
    lines.push(`⚠️  Escalated: ${record.loopState.blockedReason ?? "user intervention required"}`);
  }

  if (record.loopState.hasContradiction) {
    lines.push(`⚠️  Contradiction detected: ${record.loopState.blockedReason ?? "see latest history entry"}`);
  }

  if (record.summary) {
    lines.push(`Summary: ${record.summary}`);
  }

  return lines.join("\n");
}
