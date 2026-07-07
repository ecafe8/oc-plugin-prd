## ADDED Requirements

### Requirement: The harness SHALL require explicit user confirmation before discovery is ready for drafting
Field completeness alone SHALL NOT be sufficient to mark discovery ready for drafting. The harness SHALL require an explicit confirmation step in addition to required fields being present, across every tool that can advance the workflow out of `project_discovery` into `master_prd_drafting`.

#### Scenario: Fields complete but unconfirmed blocks drafting
- **WHEN** required discovery fields are all present but the user has not yet confirmed discovery is complete
- **THEN** both `master_prd_draft` and `master_prd_generate` SHALL remain blocked and the harness SHALL indicate that confirmation via `discovery_confirm` is the next step

#### Scenario: Confirmation unblocks drafting
- **WHEN** the user has explicitly confirmed discovery via `discovery_confirm` and required fields are present
- **THEN** `master_prd_draft` and `master_prd_generate` SHALL proceed

### Requirement: The harness SHALL provide a dedicated confirmation tool
The harness SHALL expose a standalone tool for confirming discovery readiness, distinct from the tools used to capture or update discovery content.

#### Scenario: Confirmation is rejected when fields are incomplete
- **WHEN** `discovery_confirm` is called while required fields are still missing
- **THEN** the harness SHALL reject the confirmation and report which fields are missing, without marking discovery ready

#### Scenario: Confirmation succeeds when fields are complete
- **WHEN** `discovery_confirm` is called while all required fields are present
- **THEN** the harness SHALL mark discovery context as `readyForDrafting` and the tracker as `discoveryReady`

### Requirement: New discovery content SHALL invalidate a prior confirmation
The harness SHALL reset discovery confirmation whenever an update actually changes discovery content material to readiness after confirmation was granted. A no-op update — one whose resulting content is identical to what is already stored — SHALL NOT invalidate an existing confirmation.

#### Scenario: A genuine change to goal, actors, constraints, assumptions, or success measures resets confirmation
- **WHEN** `discovery_update` merges values into `goal`, `actors`, `constraints`, `assumptions`, or `successMeasures` that actually change the stored content, after discovery was previously confirmed
- **THEN** the harness SHALL reset `readyForDrafting` to false, requiring a new `discovery_confirm` call before drafting can proceed

#### Scenario: Updating only questions does not reset confirmation
- **WHEN** `discovery_update` only resolves or adds open questions without changing goal, actors, constraints, assumptions, or success measures
- **THEN** the harness SHALL preserve the existing confirmation state

#### Scenario: A no-op update does not reset confirmation
- **WHEN** `discovery_update` is called with values that are already present in the stored discovery context (e.g. re-adding an actor that already exists, or re-setting the goal to its current value), such that the merged result is unchanged
- **THEN** the harness SHALL preserve the existing confirmation state rather than resetting it
