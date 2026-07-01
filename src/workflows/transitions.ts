import { REVIEW_STATUSES, WORKFLOW_STATES } from "@/utils/constants";

const transitions = new Map<string, string[]>([
  [WORKFLOW_STATES.projectDiscovery, [WORKFLOW_STATES.masterPrdDrafting]],
  [WORKFLOW_STATES.masterPrdDrafting, [WORKFLOW_STATES.masterPrdReview, WORKFLOW_STATES.changeRequestReceived]],
  [
    WORKFLOW_STATES.masterPrdReview,
    [WORKFLOW_STATES.masterPrdDrafting, WORKFLOW_STATES.featureSplitting, WORKFLOW_STATES.changeRequestReceived],
  ],
  [WORKFLOW_STATES.featureSplitting, [WORKFLOW_STATES.featureReview, WORKFLOW_STATES.changeRequestReceived]],
  [
    WORKFLOW_STATES.featureReview,
    [WORKFLOW_STATES.featureSplitting, WORKFLOW_STATES.awaitingUserConfirmation, WORKFLOW_STATES.changeRequestReceived],
  ],
  [
    WORKFLOW_STATES.awaitingUserConfirmation,
    [WORKFLOW_STATES.implementationReady, WORKFLOW_STATES.changeRequestReceived],
  ],
  [
    WORKFLOW_STATES.implementationReady,
    [WORKFLOW_STATES.implementationInProgress, WORKFLOW_STATES.changeRequestReceived],
  ],
  [WORKFLOW_STATES.implementationInProgress, [WORKFLOW_STATES.completed, WORKFLOW_STATES.changeRequestReceived]],
  [WORKFLOW_STATES.changeRequestReceived, [WORKFLOW_STATES.replanRequired]],
  [
    WORKFLOW_STATES.replanRequired,
    [WORKFLOW_STATES.masterPrdDrafting, WORKFLOW_STATES.featureSplitting, WORKFLOW_STATES.featureReview],
  ],
]);

export function canTransition(from: string, to: string): boolean {
  return transitions.get(from)?.includes(to) ?? false;
}

export function requiresReviewApproval(status: string): boolean {
  return status === REVIEW_STATUSES.approved;
}
