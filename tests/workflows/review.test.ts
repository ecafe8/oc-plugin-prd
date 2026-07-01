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
});
