import { describe, expect, it } from "bun:test";

import { resolveModelWithSource } from "@/adapters/model-selector";
import { vibeConfigSchema } from "@/schemas/config";
import { reviewRecordSchema } from "@/schemas/review";
import { REVIEW_STATUSES } from "@/utils/constants";
import {
  appendIteration,
  checkEscalationNeeded,
  createReviewIteration,
  escalateReview,
  formatReviewSummary,
  markContradiction,
  runPreChecks,
} from "@/workflows/review-loop";

function blankRecord(retryThreshold = 3) {
  return reviewRecordSchema.parse({
    decision: { status: "not_reviewed", updatedAt: new Date().toISOString() },
    loopState: { retryThreshold },
  });
}

// ── Task 4.1: approval, revision, warning-only, blocked paths ─────────────────

describe("review loop — decision paths", () => {
  it("approval: records approved iteration and updates decision status", () => {
    const record = blankRecord();
    const iteration = createReviewIteration(record, REVIEW_STATUSES.approved, "Looks good", [], [], undefined);
    const updated = appendIteration(record, iteration);
    expect(updated.decision.status).toBe(REVIEW_STATUSES.approved);
    expect(updated.history).toHaveLength(1);
    expect(updated.loopState.retryCount).toBe(0); // no retry increment on approval
  });

  it("revision: records changes_requested and increments retry count", () => {
    const record = blankRecord();
    const iteration = createReviewIteration(
      record,
      REVIEW_STATUSES.changesRequested,
      "Missing actors section",
      ["actors missing"],
      [],
      undefined,
    );
    const updated = appendIteration(record, iteration);
    expect(updated.decision.status).toBe(REVIEW_STATUSES.changesRequested);
    expect(updated.loopState.retryCount).toBe(1);
  });

  it("warning-only: retains warning message and does not increment retry count when approved", () => {
    const record = blankRecord();
    const iteration = createReviewIteration(
      record,
      REVIEW_STATUSES.approved,
      "Approved with warnings",
      [],
      ["Consider adding acceptance criteria"],
      undefined,
    );
    const updated = appendIteration(record, iteration);
    expect(updated.decision.status).toBe(REVIEW_STATUSES.approved);
    expect(updated.loopState.retryCount).toBe(0);
    expect(updated.history[0]?.warnings).toContain("Consider adding acceptance criteria");
  });

  it("blocked: markContradiction sets blocked status and records reason", () => {
    const record = blankRecord();
    const updated = markContradiction(record, "Scope in master PRD conflicts with feature PRD");
    expect(updated.decision.status).toBe(REVIEW_STATUSES.blocked);
    expect(updated.loopState.hasContradiction).toBe(true);
    expect(updated.loopState.blockedReason).toContain("Scope in master PRD");
  });
});

// ── Task 4.2: iteration history persistence and retry counting ────────────────

describe("review loop — iteration history", () => {
  it("preserves all iterations in history after multiple review attempts", () => {
    let record = blankRecord();
    for (let i = 0; i < 3; i++) {
      const iteration = createReviewIteration(
        record,
        REVIEW_STATUSES.changesRequested,
        `Attempt ${i + 1}`,
        ["blocker"],
        [],
        undefined,
      );
      record = appendIteration(record, iteration);
    }
    expect(record.history).toHaveLength(3);
    expect(record.loopState.retryCount).toBe(3);
  });

  it("increments iteration number sequentially", () => {
    let record = blankRecord();
    const first = createReviewIteration(record, REVIEW_STATUSES.changesRequested, "1st", [], [], undefined);
    record = appendIteration(record, first);
    const second = createReviewIteration(record, REVIEW_STATUSES.approved, "2nd", [], [], undefined);
    expect(second.iteration).toBe(2);
  });

  it("each iteration preserves its own timestamp", () => {
    const record = blankRecord();
    const iteration = createReviewIteration(record, REVIEW_STATUSES.approved, "ok", [], [], undefined);
    expect(iteration.timestamp).toBeTruthy();
    expect(new Date(iteration.timestamp).toString()).not.toBe("Invalid Date");
  });
});

// ── Task 4.3: review model role resolution and fallback ───────────────────────

describe("review model resolution", () => {
  it("uses configured review model", () => {
    const config = vibeConfigSchema.parse({
      models: { review: { model: "anthropic/claude-opus-4-5" } },
    });
    const result = resolveModelWithSource(config, "review");
    expect(result.source).toBe("configured");
    expect(result.model).toBe("anthropic/claude-opus-4-5");
  });

  it("falls back to opencode-default when no review model is configured", () => {
    const config = vibeConfigSchema.parse({});
    const result = resolveModelWithSource(config, "review");
    expect(result.source).toBe("opencode-default");
    expect(result.model).toBeUndefined();
  });

  it("records review model in iteration metadata", () => {
    const record = blankRecord();
    const iteration = createReviewIteration(
      record,
      REVIEW_STATUSES.approved,
      "ok",
      [],
      [],
      "anthropic/claude-opus-4-5",
    );
    expect(iteration.reviewModel).toBe("anthropic/claude-opus-4-5");
  });
});

// ── Task 4.4: escalation on repeated failure or contradictory context ─────────

describe("escalation control", () => {
  it("escalation is not needed before retry threshold is reached", () => {
    const record = blankRecord(3);
    let updated = record;
    for (let i = 0; i < 2; i++) {
      const iter = createReviewIteration(updated, REVIEW_STATUSES.changesRequested, "fail", ["b"], [], undefined);
      updated = appendIteration(updated, iter);
    }
    expect(checkEscalationNeeded(updated)).toBe(false);
  });

  it("escalation is needed once retry threshold is reached", () => {
    let record = blankRecord(3);
    for (let i = 0; i < 3; i++) {
      const iter = createReviewIteration(record, REVIEW_STATUSES.changesRequested, "fail", ["b"], [], undefined);
      record = appendIteration(record, iter);
    }
    expect(checkEscalationNeeded(record)).toBe(true);
  });

  it("escalateReview marks record as escalated and blocked", () => {
    let record = blankRecord(3);
    for (let i = 0; i < 3; i++) {
      const iter = createReviewIteration(record, REVIEW_STATUSES.changesRequested, "fail", ["b"], [], undefined);
      record = appendIteration(record, iter);
    }
    const escalated = escalateReview(record, "Exceeded retry limit");
    expect(escalated.loopState.escalated).toBe(true);
    expect(escalated.decision.status).toBe(REVIEW_STATUSES.blocked);
    expect(escalated.loopState.blockedReason).toContain("Exceeded retry limit");
  });

  it("formatReviewSummary includes escalation message when escalated", () => {
    let record = blankRecord(2);
    for (let i = 0; i < 2; i++) {
      const iter = createReviewIteration(record, REVIEW_STATUSES.changesRequested, "fail", [], [], undefined);
      record = appendIteration(record, iter);
    }
    record = escalateReview(record, "Too many failures");
    const summary = formatReviewSummary(record);
    expect(summary).toContain("Escalated");
  });
});

// ── Pre-check execution ───────────────────────────────────────────────────────

describe("runPreChecks", () => {
  it("returns not passed for empty content", () => {
    const result = runPreChecks("", "master_prd");
    expect(result.passed).toBe(false);
    expect(result.blockers).toContain("Document is empty");
  });

  it("warns when document is very short", () => {
    const result = runPreChecks("Short doc", "master_prd");
    expect(result.warnings.some((w) => w.includes("short"))).toBe(true);
  });

  it("passes for a document with sufficient content", () => {
    const content = "# Goals\nThis is the goal.\n\n# Users\nEnd users.\n\n# Scope\nIn scope: X.".repeat(5);
    const result = runPreChecks(content, "master_prd");
    expect(result.passed).toBe(true);
    expect(result.blockers).toHaveLength(0);
  });
});
