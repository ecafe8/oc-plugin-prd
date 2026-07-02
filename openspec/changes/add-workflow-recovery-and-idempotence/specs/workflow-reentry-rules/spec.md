## ADDED Requirements

### Requirement: The harness SHALL define explicit re-entry rules for key workflow phases
The workflow SHALL not rely on implicit assumptions when partially completed or rejected work needs to re-enter the orchestration flow.

#### Scenario: Rejected review re-enters a controlled revision path
- **WHEN** a review result blocks approval for a master PRD or feature artifact
- **THEN** the harness SHALL route that work back to an explicit revision state and require a new review iteration before dependent stages resume

#### Scenario: Replan-required work re-enters after a change request
- **WHEN** a feature or workflow path is marked `replan_required`
- **THEN** the harness SHALL define which prior artifacts remain valid, which states must be revisited, and where the workflow re-entry point begins
