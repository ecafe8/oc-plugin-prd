import { describe, expect, it } from "bun:test";
import { WORKFLOW_STATES } from "@/utils/constants";
import { canTransition } from "@/workflows";

describe("canTransition", () => {
  it("allows known transitions", () => {
    expect(canTransition(WORKFLOW_STATES.projectDiscovery, WORKFLOW_STATES.masterPrdDrafting)).toBe(true);
    expect(canTransition(WORKFLOW_STATES.replanRequired, WORKFLOW_STATES.featureReview)).toBe(true);
  });

  it("rejects invalid transitions", () => {
    expect(canTransition(WORKFLOW_STATES.projectDiscovery, WORKFLOW_STATES.completed)).toBe(false);
  });
});
