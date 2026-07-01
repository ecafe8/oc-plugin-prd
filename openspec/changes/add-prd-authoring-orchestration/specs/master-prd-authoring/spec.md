## ADDED Requirements

### Requirement: The harness SHALL generate the master PRD from structured discovery context
The harness SHALL produce `docs/master-prd.md` from persisted discovery context and current workflow state rather than from raw conversation only.

#### Scenario: Initial draft is generated from discovery
- **WHEN** discovery is marked ready and the harness enters `master_prd_drafting`
- **THEN** the harness SHALL generate the initial master PRD using the configured drafting model role and the persisted discovery context

### Requirement: The harness SHALL support revision-based master PRD authoring
The harness SHALL update the master PRD in response to user feedback or review feedback without discarding the structured context that produced it.

#### Scenario: User feedback triggers revision
- **WHEN** the user requests changes to the master PRD after a draft exists
- **THEN** the harness SHALL preserve the existing document, apply the revision context, and produce an updated master PRD draft

#### Scenario: Review feedback routes drafting backward
- **WHEN** master PRD review requests changes
- **THEN** the harness SHALL transition the workflow back to `master_prd_drafting` and retain the review summary for the next authoring pass

### Requirement: The harness SHALL advance the workflow to master PRD review when a draft is ready
The harness SHALL transition the workflow from `master_prd_drafting` to `master_prd_review` once an initial or revised master PRD draft exists and the user or harness marks it ready for review.

#### Scenario: Draft advances to review stage
- **WHEN** a master PRD draft exists and drafting is complete
- **THEN** the harness SHALL transition the workflow state to `master_prd_review` and persist the draft timestamp in tracker metadata
