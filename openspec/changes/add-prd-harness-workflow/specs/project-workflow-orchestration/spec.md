## ADDED Requirements

### Requirement: The harness SHALL manage the project lifecycle through explicit workflow states
The harness SHALL represent the end-to-end project lifecycle as explicit workflow states and SHALL persist the current state in a machine-readable tracker so the workflow can be resumed safely across sessions.

#### Scenario: Project starts in discovery
- **WHEN** a user initializes a new workspace and describes the project goal in natural language
- **THEN** the harness records the workflow state as `project_discovery`

#### Scenario: Review gate advances the workflow
- **WHEN** the master PRD review is approved
- **THEN** the harness transitions the workflow from `master_prd_review` to `feature_splitting`

#### Scenario: Midstream change request reopens planning
- **WHEN** a new requirement is introduced after implementation planning or implementation has started
- **THEN** the harness transitions the workflow to `change_request_received` and marks impacted work for replanning

#### Scenario: Session resumes from persisted tracker state
- **WHEN** a user reopens a workspace with an existing tracker after a prior session ended during an active workflow stage
- **THEN** the harness SHALL restore the current workflow state from the tracker before offering next-step actions

### Requirement: The harness SHALL restrict workflow actions by lifecycle state
The harness SHALL determine which tools, prompts, and next steps are valid based on the current workflow state so users and agents cannot skip required review and confirmation gates.

#### Scenario: Implementation cannot start before confirmation
- **WHEN** feature reviews are complete but the user has not confirmed implementation
- **THEN** the harness SHALL keep the workflow in `awaiting_user_confirmation` and SHALL NOT allow implementation execution to begin

#### Scenario: Planning cannot run before feature review
- **WHEN** feature PRD documents exist but review results are missing or not approved
- **THEN** the harness SHALL block plan generation for that feature

### Requirement: The harness SHALL support first-class change-request handling
The harness SHALL preserve a structured record of each new or revised requirement introduced after initial planning and SHALL map the request to affected features and workflow states.

#### Scenario: Change request creates a durable record
- **WHEN** a user asks to change scope, priorities, or acceptance criteria after the initial PRD cycle
- **THEN** the harness SHALL create a change-request record containing the request, impact analysis, and resulting decision

#### Scenario: Change request flags impacted features
- **WHEN** a change request affects one or more planned or active features
- **THEN** the harness SHALL mark those features as `replan_required` in the tracker

#### Scenario: Replan routes back to the correct lifecycle stage
- **WHEN** a feature or project is marked `replan_required`
- **THEN** the harness SHALL route the workflow back to `master_prd_drafting`, `feature_splitting`, or `feature_review` according to the highest artifact level invalidated by the change request

#### Scenario: Change request records are structured and addressable
- **WHEN** the harness records a change request
- **THEN** it SHALL create a deterministic `change-<sequence>-<slug>` record containing request, impact, and decision artifacts that can be referenced by the tracker
