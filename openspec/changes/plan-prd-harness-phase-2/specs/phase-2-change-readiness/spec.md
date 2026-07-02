## ADDED Requirements

### Requirement: Phase 2 planning SHALL define ready criteria for each child change
Each child change in phase 2 SHALL have concrete prerequisites that determine when implementation can begin safely.

#### Scenario: Dogfooding change readiness is evaluated
- **WHEN** the roadmap evaluates whether `add-end-to-end-dogfooding-flow` is ready to start
- **THEN** it SHALL confirm that the core phase 1 tools exist, a canonical scenario can be chosen, and expected state and artifact boundaries are known

#### Scenario: Recovery hardening change readiness is evaluated
- **WHEN** the roadmap evaluates whether `add-workflow-recovery-and-idempotence` is ready to start
- **THEN** it SHALL require that at least one canonical happy path exists, dogfooding has exposed concrete re-entry or repeatability issues, and conflict classes are clear enough to formalize

#### Scenario: Documentation change readiness is evaluated
- **WHEN** the roadmap evaluates whether `add-plugin-productization-docs` is ready to start
- **THEN** it SHALL require a stable canonical workflow and sufficiently settled recovery and conflict behavior

### Requirement: Phase 2 planning SHALL define done criteria for each child change
Each child change in phase 2 SHALL state the observable completion signals that make it archivable.

#### Scenario: Dogfooding change completion is reviewed
- **WHEN** `add-end-to-end-dogfooding-flow` is considered complete
- **THEN** the roadmap SHALL expect a full-chain scenario that is automatically verified, key artifact classes that are validated, and repeatability coverage for selected rerun paths

#### Scenario: Recovery hardening completion is reviewed
- **WHEN** `add-workflow-recovery-and-idempotence` is considered complete
- **THEN** the roadmap SHALL expect tested rerun and recovery paths, explicit conflict outcomes, and clear repair guidance for manual follow-up cases

#### Scenario: Documentation change completion is reviewed
- **WHEN** `add-plugin-productization-docs` is considered complete
- **THEN** the roadmap SHALL expect a README and supporting docs that describe the validated canonical workflow, cover setup, concepts, examples, and troubleshooting, and align with observed runtime behavior rather than intended behavior
