## ADDED Requirements

### Requirement: Planned child changes SHALL expose dependency and readiness state
Each planned child change SHALL document its dependencies and readiness state so contributors know which change can be started next.

#### Scenario: Readiness is explicit
- **WHEN** a contributor checks the PRD harness roadmap
- **THEN** each planned child change SHALL expose whether it is `planned`, `ready`, `active`, `blocked`, or `done`

### Requirement: The harness roadmap MAY summarize child changes outside the change folders
The harness tracker MAY maintain a lightweight roadmap summary of child changes, but the child change directory SHALL remain the authoritative planning artifact for each change.

#### Scenario: Tracker references child changes
- **WHEN** the harness tracker shows planned follow-up work
- **THEN** it MAY summarize change names, goals, dependencies, and status while still referring contributors to the corresponding OpenSpec change directory for full artifacts

### Requirement: A child change SHALL be started only after prerequisites are satisfied
The project SHALL prevent dependent child changes from being treated as ready before their prerequisite changes are complete or stable enough to depend on.

#### Scenario: Dependency blocks a child change
- **WHEN** `add-feature-decomposition-engine` is selected before `add-prd-authoring-orchestration` is complete or stable
- **THEN** the roadmap SHALL mark the decomposition change as blocked rather than ready
