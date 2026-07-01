## ADDED Requirements

### Requirement: The harness SHALL maintain a concise master PRD as project-level intent
The harness SHALL create and maintain a `docs/master-prd.md` file that captures project goals, users, scope, priorities, dependencies, and success measures without feature-level implementation detail.

#### Scenario: Master PRD avoids implementation detail
- **WHEN** the harness drafts or revises the master PRD
- **THEN** the document SHALL describe the project constitution and SHALL NOT contain feature-specific technical implementation detail

#### Scenario: Master PRD includes required project fields
- **WHEN** the harness creates or updates `docs/master-prd.md`
- **THEN** the document SHALL include project goals, target users or actors, scope boundaries, non-goals, priorities, dependencies or constraints, and success measures

### Requirement: The harness SHALL split each feature into small, purpose-specific PRD files
The harness SHALL create a dedicated feature directory under `docs/features/feat-xx/` and SHALL split feature documentation into predictable small files with clear responsibilities.

#### Scenario: Feature directory is scaffolded with canonical files
- **WHEN** the harness decomposes approved project scope into a new feature
- **THEN** it SHALL create `index.md`, `01-foundation.md`, `02-product.md`, `03-ui-ux.md`, `04-technical.md`, `05-plan.md`, and `review.yaml` in the feature directory

#### Scenario: Feature directories use deterministic names
- **WHEN** the harness creates a feature directory
- **THEN** it SHALL use `feat-<slug>` naming with a lowercase kebab-case slug and SHALL append a deterministic numeric suffix when the base slug collides with an existing feature

#### Scenario: Optional dimensions remain explicit
- **WHEN** a feature has no UI surface or another dimension is not applicable
- **THEN** the harness SHALL preserve the canonical file set and SHALL mark the inapplicable document as `not_applicable` rather than removing the dimension from the feature model

### Requirement: Each feature PRD file SHALL have a distinct semantic role
The harness SHALL enforce non-overlapping responsibilities for feature PRD files so downstream planning and coding agents can consume only the relevant context.

#### Scenario: Index document summarizes the feature package
- **WHEN** the harness writes `index.md`
- **THEN** the document SHALL include the feature identifier, title, current status, linked document inventory, and major dependencies or blockers

#### Scenario: Foundation document defines boundaries
- **WHEN** the harness writes `01-foundation.md`
- **THEN** the document SHALL define terms, actors, permissions, scope boundaries, assumptions, dependencies, and non-goals

#### Scenario: Product document defines behavior
- **WHEN** the harness writes `02-product.md`
- **THEN** the document SHALL define business rules, state transitions, normal flow, exception flow, and Given-When-Then acceptance criteria

#### Scenario: UI document defines interaction states
- **WHEN** the harness writes `03-ui-ux.md`
- **THEN** the document SHALL define component boundaries, user feedback expectations, and loading, empty, error, and success states for the feature surface

#### Scenario: Technical document defines implementation contracts
- **WHEN** the harness writes `04-technical.md`
- **THEN** the document SHALL define data contracts, API contracts, observability impact, and migration or rollback considerations before implementation begins

### Requirement: The harness SHALL keep plan documents separate from product intent documents
The harness SHALL generate `05-plan.md` only after feature review passes and SHALL use it for implementation tasks rather than mixing task checklists into foundation, product, or technical PRD files.

#### Scenario: Plan follows review approval
- **WHEN** a feature review result is approved
- **THEN** the harness SHALL allow `05-plan.md` generation for that feature

#### Scenario: Feature documents stay focused on intent
- **WHEN** PRD documents are revised during review
- **THEN** implementation task breakdown SHALL remain outside `01-foundation.md`, `02-product.md`, and `04-technical.md`
