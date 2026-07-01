## ADDED Requirements

### Requirement: The harness SHALL maintain aggregate workflow and progress state outside OpenSpec
The harness SHALL persist project, feature, and task progress in a harness-owned tracker so overall workflow status remains available before, during, and after implementation.

#### Scenario: Tracker stores project and feature status
- **WHEN** the harness updates progress
- **THEN** `.vibe/tracker.yaml` SHALL record the current workflow state, feature statuses, approvals, and task progress needed for total project visibility

#### Scenario: Tracker survives implementation phase
- **WHEN** one or more features are being implemented through OpenSpec-driven work
- **THEN** the harness SHALL continue using `.vibe/tracker.yaml` as the aggregate project-progress source of truth

### Requirement: The harness SHALL hand approved feature work into OpenSpec for implementation-phase execution
The harness SHALL translate approved feature planning artifacts into OpenSpec change artifacts or linked implementation context once a feature is confirmed for delivery.

#### Scenario: OpenSpec handoff occurs after approval
- **WHEN** a feature reaches `implementation_ready`
- **THEN** the harness SHALL create or update corresponding OpenSpec implementation artifacts for that feature before implementation execution begins

#### Scenario: OpenSpec does not replace workflow control
- **WHEN** OpenSpec tasks advance or complete
- **THEN** the harness SHALL synchronize progress back into `.vibe/tracker.yaml` without delegating overall workflow-state ownership to OpenSpec

#### Scenario: Synchronization runs after implementation-phase updates
- **WHEN** the harness completes an implementation-phase action or observes an OpenSpec task-state change through an explicit sync step or hook
- **THEN** it SHALL refresh the related feature and task progress in `.vibe/tracker.yaml`

### Requirement: The harness SHALL synchronize change-request impact across tracker and implementation artifacts
The harness SHALL reconcile midstream requirement changes against both aggregate tracking records and any existing implementation-phase artifacts.

#### Scenario: Replanning invalidates downstream execution context
- **WHEN** a change request affects a feature that already has an OpenSpec change or task plan
- **THEN** the harness SHALL mark the feature as `replan_required` and SHALL identify whether the OpenSpec artifacts need regeneration or amendment

#### Scenario: Progress snapshot reflects blockers and replanning
- **WHEN** the user asks for overall project status after a change request or failed review
- **THEN** the harness SHALL include blocked and replan-required items in its aggregated progress output

#### Scenario: Tracker remains authoritative during conflicts
- **WHEN** harness-managed workflow state and OpenSpec artifact state disagree
- **THEN** the harness SHALL treat `.vibe/tracker.yaml` as the authoritative source for overall workflow status and SHALL surface the inconsistency for reconciliation
