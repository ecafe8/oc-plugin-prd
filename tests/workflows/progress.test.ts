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
      authoring: {},
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

  it("does not mark workflow completed while other features remain unfinished", () => {
    const tracker = trackerSchema.parse({
      workflow: {
        state: WORKFLOW_STATES.implementationReady,
        updatedAt: new Date().toISOString(),
      },
      project: {},
      authoring: {},
      features: [
        {
          id: "feat-a",
          slug: "a",
          sequence: 1,
          title: "Feature A",
          status: FEATURE_STATUSES.implementationReady,
          docs: {},
          dependencies: [],
          blockers: [],
          reviewPath: "docs/features/feat-a/review.yaml",
          tasks: [
            {
              id: "A-1",
              title: "Done task",
              status: TASK_STATUSES.done,
              dependsOn: [],
              targets: [],
              verification: [],
            },
          ],
        },
        {
          id: "feat-b",
          slug: "b",
          sequence: 2,
          title: "Feature B",
          status: FEATURE_STATUSES.implementationReady,
          docs: {},
          dependencies: [],
          blockers: [],
          reviewPath: "docs/features/feat-b/review.yaml",
          tasks: [
            {
              id: "B-1",
              title: "Pending task",
              status: TASK_STATUSES.pending,
              dependsOn: [],
              targets: [],
              verification: [],
            },
          ],
        },
      ],
      changeRequests: [],
    });

    const next = syncOpenSpecStatus(tracker, "feat-a");

    expect(next.features[0]?.status).toBe(FEATURE_STATUSES.done);
    expect(next.workflow.state).toBe(WORKFLOW_STATES.implementationReady);
  });
});
