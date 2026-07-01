## ADDED Requirements

### Requirement: The harness SHALL evaluate PRD artifacts against blocking quality gates
The harness SHALL evaluate master PRDs, feature PRDs, and implementation plans against explicit quality gates before allowing the workflow to progress.

#### Scenario: Global PRD checks are enforced
- **WHEN** the harness reviews a PRD artifact
- **THEN** it SHALL evaluate at least background concreteness, measurable goals, explicit actors, scope boundaries, actionable business rules, edge-case coverage, testable acceptance criteria, priority clarity, dependency clarity, and risk clarity

#### Scenario: Failed quality gates block progress
- **WHEN** one or more blocking checks fail during review
- **THEN** the harness SHALL return a non-approved review decision and SHALL keep the workflow in the current review stage

### Requirement: The harness SHALL apply document-specific review checks by PRD type
The harness SHALL supplement global checks with document-specific checks appropriate to the semantic role of each PRD file.

#### Scenario: Product review checks behavior completeness
- **WHEN** the harness reviews `02-product.md`
- **THEN** it SHALL evaluate business rule completeness, state progression, normal and exception coverage, and Given-When-Then acceptance detail

#### Scenario: Technical review checks delivery contracts
- **WHEN** the harness reviews `04-technical.md`
- **THEN** it SHALL evaluate data and API contracts, migration impact, rollback expectations, test strategy, and observability needs

### Requirement: The harness SHALL persist review outcomes as structured records
The harness SHALL write review results to structured files so workflow transitions, retries, and dashboards can rely on deterministic fields instead of prose-only comments.

#### Scenario: Review result is machine-readable
- **WHEN** a feature review completes
- **THEN** the harness SHALL update `review.yaml` with decision status, quality-gate results, document-specific check results, and a summary of required follow-up

#### Scenario: Review status governs planning eligibility
- **WHEN** `review.yaml` records `approved`
- **THEN** the harness SHALL allow plan generation for the reviewed scope

### Requirement: The harness SHALL separate authoring templates from review rules
The harness SHALL maintain PRD templates and review rules as distinct assets so document structure can evolve independently from quality enforcement.

#### Scenario: Review logic does not require template edits
- **WHEN** a new review criterion is added to the harness
- **THEN** the change MAY update review-rule assets without requiring direct edits to every PRD template
