import { describe, expect, it } from "bun:test";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { trackerSchema } from "@/schemas/tracker";
import { createChangeRequest, readTracker, writeTracker } from "@/store";
import { FEATURE_STATUSES, WORKFLOW_STATES } from "@/utils/constants";
import { scaffoldFeature } from "@/workflows";

describe("workflow integration", () => {
  it("supports replan-required recovery path", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "oc-plugin-prd-integration-"));
    const feature = await scaffoldFeature(root, "Billing", 1);
    const tracker = trackerSchema.parse({
      workflow: {
        state: WORKFLOW_STATES.awaitingUserConfirmation,
        updatedAt: new Date().toISOString(),
      },
      project: {
        title: "Billing Project",
        summary: "Implement billing",
      },
      authoring: {},
      features: [
        {
          ...feature,
          status: FEATURE_STATUSES.awaitingConfirmation,
          reviewPath: `docs/features/${feature.id}/review.yaml`,
          tasks: [],
        },
      ],
      changeRequests: [],
    });
    await writeTracker(root, tracker);

    await createChangeRequest(
      root,
      {
        id: "billing-change-1",
        sequence: 1,
        slug: "billing-scope",
        title: "Adjust billing scope",
        createdAt: new Date().toISOString(),
        impactedFeatures: [feature.id],
        impactedStates: [WORKFLOW_STATES.changeRequestReceived, WORKFLOW_STATES.replanRequired],
      },
      "Need to revise billing scope.",
    );

    const next = await readTracker(root);

    expect(next.changeRequests).toHaveLength(1);
    expect(next.workflow.activeChangeRequestId).toBe("billing-change-1");
  });
});
