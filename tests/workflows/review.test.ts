import { describe, expect, it } from "bun:test";

import { createApprovedReview, createPendingReview } from "@/workflows";

describe("review workflow", () => {
  it("creates approved review with pass checks", () => {
    const review = createApprovedReview("ok");
    expect(review.decision.status).toBe("approved");
    expect(review.qualityGates.background_concrete).toBe("pass");
    expect(review.documentChecks.foundation).toBe("pass");
  });

  it("creates pending review with warning checks", () => {
    const review = createPendingReview("needs work");
    expect(review.decision.status).toBe("changes_requested");
    expect(review.qualityGates.background_concrete).toBe("warning");
    expect(review.documentChecks.plan).toBe("warning");
  });

  it("persists configured limits in a new pending review", () => {
    const review = createPendingReview("needs revision", { maxIterations: 5, escalationAfter: 3 });
    expect(review.loopState.maxIterations).toBe(5);
    expect(review.loopState.escalationAfter).toBe(3);
    expect(review.loopState.retryThreshold).toBe(3);
  });

  it("persists configured limits in a new approved review", () => {
    const review = createApprovedReview("approved", { maxIterations: 4, escalationAfter: 2 });
    expect(review.loopState.maxIterations).toBe(4);
    expect(review.loopState.escalationAfter).toBe(2);
  });

  it("keeps the original limits when a later config value changes", () => {
    const review = createPendingReview("needs revision", { maxIterations: 5, escalationAfter: 3 });
    const laterConfigLimits = { maxIterations: 10, escalationAfter: 8 };

    expect(review.loopState.maxIterations).toBe(5);
    expect(review.loopState.escalationAfter).toBe(3);
    expect(laterConfigLimits.maxIterations).not.toBe(review.loopState.maxIterations);
  });

  it("keeps approval explicit even when a review reaches its iteration limit", () => {
    const review = createApprovedReview("approved", { maxIterations: 1, escalationAfter: 1 });
    expect(review.decision.status).toBe("approved");
    expect(review.loopState.escalated).toBe(false);
  });
});
