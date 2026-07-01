## ADDED Requirements

### Requirement: The harness SHALL infer and persist feature dependencies
The harness SHALL infer dependencies and ordering hints between materialized features and persist them in machine-readable form.

#### Scenario: Hard dependency is recorded
- **WHEN** one generated feature must exist before another can deliver user value or technical feasibility
- **THEN** the harness SHALL record the prerequisite feature as a dependency in the dependent feature metadata

#### Scenario: Uncertain dependency is preserved as a soft signal
- **WHEN** the engine detects a possible shared prerequisite but cannot confirm a strict dependency
- **THEN** the harness SHALL record that signal as a blocker or note rather than silently discarding it
