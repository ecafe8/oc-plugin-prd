export const VIBE_DIR = ".vibe";
export const DOCS_DIR = "docs";
export const FEATURES_DIR = "docs/features";
export const OPENSPEC_DIR = "openspec";

export const USER_CONFIG_FILE = "oc-plugin-prd.jsonc";
export const WORKSPACE_CONFIG_PATH = `${VIBE_DIR}/config.yaml`;
export const TRACKER_PATH = `${VIBE_DIR}/tracker.yaml`;
export const SESSION_PATH = `${VIBE_DIR}/sessions/current.yaml`;
export const REVIEWS_DIR = `${VIBE_DIR}/reviews`;
export const CHANGES_DIR = `${VIBE_DIR}/changes`;
export const MASTER_PRD_PATH = `${DOCS_DIR}/master-prd.md`;

export const FEATURE_FILE_NAMES = {
  index: "index.md",
  foundation: "01-foundation.md",
  product: "02-product.md",
  uiUx: "03-ui-ux.md",
  technical: "04-technical.md",
  plan: "05-plan.md",
  review: "review.yaml",
} as const;

export const REVIEW_STATUSES = {
  approved: "approved",
  changesRequested: "changes_requested",
  blocked: "blocked",
  notReviewed: "not_reviewed",
} as const;

export const TASK_STATUSES = {
  pending: "pending",
  inProgress: "in_progress",
  done: "done",
  blocked: "blocked",
} as const;

export const FEATURE_STATUSES = {
  draft: "draft",
  inReview: "in_review",
  awaitingConfirmation: "awaiting_confirmation",
  implementationReady: "implementation_ready",
  implementationInProgress: "implementation_in_progress",
  replanRequired: "replan_required",
  done: "done",
} as const;

export const WORKFLOW_STATES = {
  projectDiscovery: "project_discovery",
  masterPrdDrafting: "master_prd_drafting",
  masterPrdReview: "master_prd_review",
  featureSplitting: "feature_splitting",
  featureReview: "feature_review",
  awaitingUserConfirmation: "awaiting_user_confirmation",
  implementationReady: "implementation_ready",
  implementationInProgress: "implementation_in_progress",
  changeRequestReceived: "change_request_received",
  replanRequired: "replan_required",
  completed: "completed",
} as const;

export const MODEL_ROLES = {
  drafting: "drafting",
  review: "review",
} as const;

export const CONFIG_ERROR_SEVERITY = {
  warn: "warn",
  block: "block",
} as const;

export type WorkflowState = (typeof WORKFLOW_STATES)[keyof typeof WORKFLOW_STATES];
export type ReviewStatus = (typeof REVIEW_STATUSES)[keyof typeof REVIEW_STATUSES];
export type TaskStatus = (typeof TASK_STATUSES)[keyof typeof TASK_STATUSES];
export type FeatureStatus = (typeof FEATURE_STATUSES)[keyof typeof FEATURE_STATUSES];
export type ModelRole = keyof typeof MODEL_ROLES;
