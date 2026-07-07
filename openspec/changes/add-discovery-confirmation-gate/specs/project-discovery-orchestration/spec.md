## MODIFIED Requirements

### Requirement: Discovery SHALL expose readiness for master PRD drafting
The harness SHALL determine whether discovery is sufficiently complete for master PRD generation. Readiness SHALL require both required-field completeness and explicit user confirmation via `discovery_confirm`.

#### Scenario: Discovery fields are complete but not yet confirmed
- **WHEN** the project goal, actors, and success measures are available or explicitly marked provisional, but the user has not yet confirmed via `discovery_confirm`
- **THEN** the harness SHALL remain in `project_discovery` and report that discovery is field-complete but pending explicit confirmation

#### Scenario: Discovery is marked ready
- **WHEN** the project goal, actors, and success measures are available or explicitly marked provisional, and the user has explicitly confirmed via `discovery_confirm`
- **THEN** the harness SHALL mark discovery as ready for `master_prd_drafting`

#### Scenario: Discovery remains in clarification mode
- **WHEN** essential discovery fields are missing and cannot be inferred safely
- **THEN** the harness SHALL remain in `project_discovery` and surface the missing inputs or open questions
