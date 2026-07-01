## ADDED Requirements

### Requirement: The harness SHALL execute structured review loops for PRD artifacts
The harness SHALL evaluate master and feature PRD artifacts through a repeatable review loop that records decisions and determines whether drafting, revision, or approval should follow.

#### Scenario: Review loop approves an artifact
- **WHEN** deterministic checks pass and the review-model decision is approved
- **THEN** the harness SHALL persist an approved review result and allow the workflow to advance

#### Scenario: Review loop rejects an artifact
- **WHEN** blocking findings are detected during review
- **THEN** the harness SHALL persist a change-requested or blocked result and route the artifact back into revision flow

### Requirement: Review loops SHALL require explicit re-review after revisions
The harness SHALL not treat a previously rejected artifact as approved simply because it changed on disk.

#### Scenario: Revised artifact re-enters review
- **WHEN** an author revises a document after a failed review
- **THEN** the harness SHALL run a new review iteration before allowing any dependent workflow stage to proceed

### Requirement: Feature review approval SHALL trigger plan generation eligibility
The harness SHALL mark a feature as eligible for `05-plan.md` generation once the feature PRD review is approved.

#### Scenario: Approved feature review enables plan generation
- **WHEN** a feature review record transitions to `approved`
- **THEN** the harness SHALL allow the `plan_generate` tool to run for that feature and update the feature status accordingly

### Requirement: Review execution SHALL resolve the review model role from configuration
The harness SHALL select the configured review model role before executing the review-model critique step.

#### Scenario: Workspace review model is used for critique
- **WHEN** `.vibe/config.yaml` defines a review model role
- **THEN** the harness SHALL use that model selection when running the review-model critique and decision synthesis step

#### Scenario: Missing review model falls back safely
- **WHEN** no review model role is configured
- **THEN** the harness SHALL fall back to the OpenCode default model and proceed with review rather than blocking
