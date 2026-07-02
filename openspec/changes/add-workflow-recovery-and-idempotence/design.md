## Context

The PRD harness now spans multiple persistent layers:

- tracker workflow state
- discovery and authoring artifacts
- feature directories and plans
- review history
- OpenSpec implementation artifacts

This creates a strong capability surface, but also introduces recovery and rerun complexity. Real-world usage will inevitably include interruption, repeated commands, review rejection, change requests after planning, and tracker or OpenSpec disagreement.

## Goals / Non-Goals

**Goals:**

- Define allowed re-entry points for major workflow stages.
- Make repeated execution of selected actions safe and predictable.
- Clarify cross-system conflict outcomes.
- Provide repair guidance when manual intervention is required.

**Non-Goals:**

- Automatically repairing every malformed state.
- Rewriting the entire workflow state model.
- Adding a UI layer for diagnostics.
- Fixing speculative edge cases not observed during dogfooding.

## Decisions

### 1. Recovery rules must be grounded in observed workflow stress

This change SHALL formalize rerun and recovery behavior using the canonical dogfooding scenario and its discovered rough edges as the primary input.

Rationale:

- avoids theoretical overdesign
- ensures the hardest real paths get solved first

### 2. Idempotence is defined per tool boundary, not as a vague global promise

Repeat-safe behavior SHALL be specified for concrete operations such as OpenSpec generation, OpenSpec sync, plan generation, and selected artifact-producing transitions.

Rationale:

- keeps guarantees explicit
- avoids accidental promises for tools whose semantics should remain strict

### 3. Tracker workflow stage remains authoritative while task-level sync stays explainable

When tracker workflow state and OpenSpec task state disagree, the harness SHALL preserve tracker authority for workflow stage progression while still surfacing task-level conflicts clearly.

Rationale:

- protects orchestration semantics
- keeps OpenSpec progress useful without letting it silently rewrite workflow stage intent

### 4. Manual repair must be guided, not hidden

When a state mismatch cannot be safely auto-fixed, the harness SHALL return structured outcomes with enough guidance for a human operator to continue.

Rationale:

- silent failure is worse than explicit manual follow-up
- maintainers need actionable next steps, not only a conflict label

## Recovery Focus Areas

### Review rejection and rerun

- define where rejected work re-enters the flow
- require explicit re-review after revision

### Replan-required re-entry

- define how change requests affect planned or implementation-ready features
- define how downstream artifacts are preserved or revisited

### Cross-system disagreement

- classify tracker-ahead versus OpenSpec-ahead cases
- distinguish safe update, no-op, conflict, and manual follow-up outcomes

### Existing artifact reuse

- define when reruns update in place
- define when reruns should stop with a clear error instead of mutating state

## Risks / Trade-offs

- [Scope creep into full state-machine redesign] -> Mitigation: focus on high-frequency recovery paths first.
- [Too much auto-repair] -> Mitigation: prefer explicit guidance when safety is unclear.
- [Uneven guarantees across tools] -> Mitigation: document guarantees per operation rather than implying blanket idempotence.
