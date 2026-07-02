## ADDED Requirements

### Requirement: The harness SHALL validate the canonical artifact baseline for end-to-end workflow execution
The dogfooding layer SHALL confirm that key workflow outputs are created in their expected locations and remain coherent with tracker state.

#### Scenario: Canonical workflow produces expected artifacts
- **WHEN** the end-to-end scenario completes its happy path
- **THEN** the harness SHALL verify coherent outputs in `.vibe/*`, `docs/features/*`, and `openspec/changes/*` for the scenario's tracked work

### Requirement: End-to-end validation SHALL verify multi-feature coherence
The dogfooding layer SHALL confirm that artifact generation remains coherent when more than one feature participates in the same scenario.

#### Scenario: Multiple features remain consistent in the same workflow run
- **WHEN** an end-to-end scenario includes at least two features or a dependency-aware split
- **THEN** the harness SHALL verify that feature artifacts, tracker references, and progress summaries remain internally consistent
