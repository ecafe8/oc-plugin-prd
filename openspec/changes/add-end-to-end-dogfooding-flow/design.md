## Context

The repository already contains:

- workflow-level tests
- targeted integration checks
- OpenSpec generation and sync validation
- progress aggregation coverage

But it does not yet prove that the whole workflow behaves coherently across multiple phases as a user would experience it.

## Goals / Non-Goals

**Goals:**

- Validate at least one canonical full-chain workflow.
- Verify both state and artifact correctness.
- Validate repeatability for selected repeated actions.
- Produce a stable baseline for recovery and product docs.

**Non-Goals:**

- Solving every recovery problem in this change.
- Refactoring the entire workflow architecture.
- Adding user-facing documentation as the main deliverable.
- Covering every speculative workflow branch.

## Decisions

### 1. Start with a bounded canonical scenario

The first end-to-end scenario SHALL be realistic but narrow enough to stay maintainable.

Rationale:

- keeps the signal high
- avoids sprawling scenario setup
- still exposes most important coordination points

### 2. Validate workflow state and artifacts together

Tests SHALL not only assert workflow state transitions, but also verify created artifacts.

Rationale:

- state alone can pass while output files are incomplete or malformed
- artifacts are part of the plugin contract

### 3. Include repeatability in the initial dogfooding scope

The change SHALL validate repeated execution behavior for selected stable operations such as OpenSpec generation and sync.

Rationale:

- repeatability is a common real-world behavior
- it is cheaper to catch now than after docs or adoption

### 4. Separate happy-path validation from later hardening

This change SHALL surface rough edges, but not necessarily fix all of them.

Rationale:

- preserves scope
- allows the next change to focus on hardening based on real evidence

## Proposed Scenario Shape

### Scenario A: Canonical happy path

goal
-> discovery context captured
-> master PRD drafted and submitted
-> feature candidates generated
-> feature materialized
-> review completed
-> plan generated
-> OpenSpec change generated
-> OpenSpec sync applied
-> progress snapshot validated

### Scenario B: Repeatability and no-op path

- rerun OpenSpec generation on an existing feature
- rerun OpenSpec sync when state already matches
- confirm outputs are stable and non-destructive

### Scenario C: Multi-feature or dependency path

- validate at least two features
- confirm tracker and artifacts remain coherent
- confirm progress summary reflects multiple items

## Risks / Trade-offs

- [Scenario too synthetic] -> Mitigation: choose a plausible project goal and realistic artifacts.
- [Too much scope in one change] -> Mitigation: keep recovery-heavy edge cases for the next change.
- [Fragile tests] -> Mitigation: assert meaningful invariants, not incidental formatting noise.
