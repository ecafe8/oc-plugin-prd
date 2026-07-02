## Context

Phase 1 completed the core workflow surface:

- discovery capture and update
- master PRD authoring
- feature decomposition
- review loop execution
- OpenSpec generation and sync
- progress aggregation

This means phase 2 should optimize for workflow truth, not raw feature count.

## Goals / Non-Goals

**Goals:**

- Define the phase 2 execution order.
- Keep phase 2 changes narrow and independently archivable.
- Prioritize real workflow validation before adoption-facing documentation.
- Make recovery and idempotence a direct response to dogfooding evidence.

**Non-Goals:**

- Implementing phase 2 behavior in this change.
- Reopening completed phase 1 changes.
- Adding UI or dashboard scope.
- Expanding speculative features without validation demand.

## Decisions

### 1. Phase 2 starts with end-to-end dogfooding

The first phase 2 child change SHALL validate a realistic user journey across the full workflow.

Rationale:

- current tests are strong in slices but weak in full-chain validation
- product docs should reflect actual working flows
- dogfooding is the fastest way to expose state-machine and artifact gaps

### 2. Recovery and idempotence follow dogfooding

The second child change SHALL focus on re-entry rules, repeat safety, conflict clarity, and repair guidance based on issues surfaced by dogfooding.

Rationale:

- avoid overdesigning recovery rules before real workflow stress exists
- keep hardening grounded in evidence

### 3. Documentation follows validated behavior

The third child change SHALL produce productization docs only after the canonical workflow and recovery expectations are stable.

Rationale:

- avoids writing aspirational docs
- reduces churn and contradiction between docs and behavior

### 4. Diagnostics is optional, not on the critical path

Operator diagnostics and observability MAY be defined as a later optional change.

Rationale:

- useful, but not required to complete the core phase 2 maturation loop

## Initial Child Change Order

1. `add-end-to-end-dogfooding-flow`
2. `add-workflow-recovery-and-idempotence`
3. `add-plugin-productization-docs`
4. `add-operator-diagnostics-and-observability` (optional)

## Ready Criteria

### `add-end-to-end-dogfooding-flow`

- core phase 1 tools exist and pass current checks
- a canonical scenario can be chosen
- expected artifacts and state transitions are known

### `add-workflow-recovery-and-idempotence`

- at least one canonical happy path exists
- dogfooding exposed concrete re-entry or repeatability issues
- conflict classes are clear enough to formalize

### `add-plugin-productization-docs`

- canonical workflow no longer changes materially
- recovery, no-op, and conflict behavior is stable enough to describe
- examples can be drawn from validated scenarios

## Done Criteria

### `add-end-to-end-dogfooding-flow`

- a full-chain scenario is automatically verified
- key artifact classes are validated
- repeatability coverage exists for selected rerun paths

### `add-workflow-recovery-and-idempotence`

- high-frequency rerun and recovery paths are formally tested
- conflict outcomes are explicit and understandable
- repair guidance is available for manual follow-up cases

### `add-plugin-productization-docs`

- README and supporting docs describe the validated canonical workflow
- setup, concepts, examples, and troubleshooting are covered
- docs align with observed runtime behavior rather than intended behavior

## Risks / Trade-offs

- [Dogfooding scope explosion] -> Mitigation: keep initial scenario realistic but bounded.
- [Recovery overdesign] -> Mitigation: require dogfooding evidence before broad hardening.
- [Documentation churn] -> Mitigation: explicitly place docs after validation and hardening.
