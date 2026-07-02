## ADDED Requirements

### Requirement: Documentation SHALL describe the validated canonical workflow end to end
The plugin documentation SHALL explain how an operator moves from goal capture through OpenSpec generation and progress tracking using the validated workflow sequence.

#### Scenario: Canonical workflow is documented as an operator journey
- **WHEN** the canonical workflow section is read
- **THEN** it SHALL describe the major phases, their expected outputs, and how the operator advances from one phase to the next

### Requirement: Documentation SHALL explain artifact responsibilities
The plugin documentation SHALL explain the responsibilities of the main workflow artifact families and how they relate to each other.

#### Scenario: Artifact directories are explained clearly
- **WHEN** the documentation describes `.vibe/*`, `docs/features/*`, and `openspec/changes/*`
- **THEN** it SHALL explain which layer is authoritative for workflow state versus implementation artifacts and how those layers interact
