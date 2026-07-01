## ADDED Requirements

### Requirement: The harness SHALL provide aggregated project progress summaries
The harness SHALL summarize overall progress across workflow stages, feature states, implementation status, blockers, and replanning signals.

#### Scenario: Progress snapshot includes workflow and blockers
- **WHEN** a contributor requests a progress summary
- **THEN** the harness SHALL report workflow state, completed work, active work, blocked work, and replan-required work in one aggregated view

### Requirement: Progress aggregation SHALL include change-request impact
The harness SHALL include active or unresolved change requests when summarizing progress.

#### Scenario: Change request appears in status summary
- **WHEN** one or more change requests are active or unresolved
- **THEN** the harness SHALL include their impact in the aggregated project progress output
