## ADDED Requirements

### Requirement: Accepted feature candidates SHALL be materialized as canonical feature matrices
The harness SHALL create the full feature document matrix for each accepted feature candidate.

#### Scenario: Feature matrix is scaffolded from candidate
- **WHEN** a feature candidate is accepted for materialization
- **THEN** the harness SHALL create the canonical `feat-<slug>` directory with manifest metadata and the required small-file document set

### Requirement: Feature matrices SHALL preserve source traceability
Each materialized feature SHALL retain traceability back to the master PRD sections or themes that produced it.

#### Scenario: Feature source references are persisted
- **WHEN** a feature directory is created
- **THEN** the harness SHALL record source references and rationale in feature metadata or summary files so future change analysis can trace the origin of the feature

### Requirement: The harness SHALL update tracker state when feature materialization begins
The harness SHALL set the workflow state to `feature_splitting` in the tracker when it begins materializing confirmed feature candidates.

#### Scenario: Tracker reflects active feature splitting
- **WHEN** the harness starts creating feature directories from confirmed candidates
- **THEN** the workflow state in `.vibe/tracker.yaml` SHALL be `feature_splitting`
