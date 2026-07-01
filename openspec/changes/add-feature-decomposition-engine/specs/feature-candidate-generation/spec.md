## ADDED Requirements

### Requirement: The harness SHALL derive feature candidates from the approved master PRD
The harness SHALL parse approved project-level intent and produce a normalized set of feature candidates before creating feature directories.

#### Scenario: Candidate set is generated from master PRD
- **WHEN** the master PRD is approved for decomposition
- **THEN** the harness SHALL generate candidate features with title, slug, summary, priority, rationale, and source references

### Requirement: Candidate generation SHALL avoid duplicate feature identity
The harness SHALL prevent duplicate or colliding feature candidates from being materialized without deterministic resolution.

#### Scenario: Candidate slug collision is resolved
- **WHEN** two feature candidates produce the same base slug
- **THEN** the harness SHALL preserve distinct identities through deterministic collision handling rather than overwriting one candidate with another

### Requirement: The harness SHALL block decomposition when the master PRD is not approved
Feature candidate generation SHALL only proceed when the master PRD has an approved review result.

#### Scenario: Unapproved master PRD blocks candidate generation
- **WHEN** the master PRD review status is not `approved`
- **THEN** the harness SHALL reject the decomposition request and surface the review status as the blocking reason

### Requirement: Feature candidates SHALL be confirmed before materialization
The harness SHALL require an explicit confirmation step between candidate generation and directory materialization so users can inspect, adjust, or discard candidates.

#### Scenario: User confirms candidate set before materialization
- **WHEN** the harness generates feature candidates from the master PRD
- **THEN** it SHALL present the candidates for user review before creating any `feat-<slug>` directories

#### Scenario: User discards or adjusts candidates
- **WHEN** a user removes or renames a candidate before confirmation
- **THEN** only the confirmed candidates SHALL be materialized into feature directories
