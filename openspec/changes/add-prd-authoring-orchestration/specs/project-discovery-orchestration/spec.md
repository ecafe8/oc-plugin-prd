## ADDED Requirements

### Requirement: The harness SHALL convert natural-language goals into structured discovery context
The harness SHALL capture a user's raw project description and normalize it into reusable discovery artifacts before master PRD drafting begins.

#### Scenario: Discovery artifacts are created from user input
- **WHEN** a user provides an initial project goal in natural language
- **THEN** the harness SHALL persist a prose discovery summary, machine-readable discovery context, and unresolved questions artifacts

### Requirement: Discovery SHALL expose readiness for master PRD drafting
The harness SHALL determine whether discovery is sufficiently complete for master PRD generation.

#### Scenario: Discovery is marked ready
- **WHEN** the project goal, actors, constraints, and provisional success measures are available or explicitly marked provisional
- **THEN** the harness SHALL mark discovery as ready for `master_prd_drafting`

#### Scenario: Discovery remains in clarification mode
- **WHEN** essential discovery fields are missing and cannot be inferred safely
- **THEN** the harness SHALL remain in `project_discovery` and surface the missing inputs or open questions

### Requirement: The harness SHALL support updating discovery context after initial capture
The harness SHALL allow discovery context to be amended or expanded without resetting the overall discovery session.

#### Scenario: Discovery context is updated in place
- **WHEN** the user provides additional goals, actors, or constraints after initial discovery artifacts exist
- **THEN** the harness SHALL merge the new information into the persisted discovery context and update the questions artifact to reflect resolved or new open items
