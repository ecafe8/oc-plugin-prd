import { describe, expect, it } from "bun:test";
import { trackerSchema } from "@/schemas/tracker";
import { FEATURE_STATUSES, TASK_STATUSES, WORKFLOW_STATES } from "@/utils/constants";
import { syncOpenSpecStatus } from "@/workflows";

describe("syncOpenSpecStatus", () => {
  it("marks feature done when all tasks are done", () => {
    const tracker = trackerSchema.parse({
      workflow: {
        state: WORKFLOW_STATES.implementationInProgress,
        updatedAt: new Date().toISOString(),
      },
      project: {},
      features: [
        {
          id: "feat-auth",
          slug: "auth",
          sequence: 1,
          title: "Auth",
          status: FEATURE_STATUSES.implementationInProgress,
          docs: {},
          dependencies: [],
          blockers: [],
          reviewPath: "docs/features/feat-auth/review.yaml",
          tasks: [
            {
              id: "AUTH-1",
              title: "Implement auth",
              status: TASK_STATUSES.done,
              dependsOn: [],
              targets: [],
              verification: [],
            },
          ],
        },
      ],
      changeRequests: [],
    });

    const next = syncOpenSpecStatus(tracker, "feat-auth");

    expect(next.features[0]?.status).toBe(FEATURE_STATUSES.done);
    expect(next.workflow.state).toBe(WORKFLOW_STATES.completed);
  });
});
