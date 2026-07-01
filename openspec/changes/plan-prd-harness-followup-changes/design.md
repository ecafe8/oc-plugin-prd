## Context

The repository now contains a working first-pass implementation of `add-prd-harness-workflow`, including schemas, stores, templates, workflow helpers, tools, and tests. That change established the platform foundation, but several meaningful product capabilities still need deeper implementation work, especially around natural-language PRD authoring, automatic feature decomposition, richer review loop execution, and stronger OpenSpec synchronization.

Continuing all of that inside a single change would make scope tracking, review, and archiving much harder. This change therefore defines the planning and tracking model for follow-up changes.

## Goals / Non-Goals

**Goals:**

- Define a canonical list of follow-up changes for the PRD harness roadmap.
- Define naming, ordering, and dependency rules for those child changes.
- Define how each child change is considered ready, active, blocked, or complete.
- Define how progress should be tracked across multiple future changes.

**Non-Goals:**

- Implementing the child changes themselves.
- Revising the already completed foundation change except where future dependencies need to reference it.
- Building a portfolio dashboard or UI layer for change tracking.

## Decisions

### 1. The foundation change remains complete and future work moves into child changes

The existing `add-prd-harness-workflow` change SHALL be treated as the foundation change. All remaining major capability work SHALL be implemented through new child changes rather than extending the foundation change indefinitely.

Rationale:

- keeps archive boundaries clean
- preserves a stable baseline for future changes
- allows selective implementation and review of high-value capabilities

### 2. Follow-up changes are defined as a prioritized dependency chain

Initial child change list:

1. `add-prd-authoring-orchestration`
2. `add-feature-decomposition-engine`
3. `add-review-loop-execution`
4. `add-openspec-progress-enhancement`

Dependency rules:

- `add-prd-authoring-orchestration` depends only on the foundation change
- `add-feature-decomposition-engine` depends on authoring orchestration
- `add-review-loop-execution` depends on feature decomposition
- `add-openspec-progress-enhancement` depends on review-loop execution and foundation OpenSpec sync primitives

Rationale:

- the authoring experience must stabilize before feature decomposition can consume it reliably
- review-loop execution depends on richer authoring and decomposition artifacts
- enhanced OpenSpec/project aggregation is easier to finalize once upstream workflow artifacts are richer

### 3. Each child change MUST define a narrow implementation slice

Each planned child change SHALL have:

- a single primary capability focus
- a proposal describing why that slice matters now
- a design that limits cross-cutting sprawl
- a task list that can be completed and archived independently

Rationale:

- smaller changes are easier to review and recover if design assumptions change

### 4. Child change planning should be tracked in both OpenSpec and the harness tracker

Tracking layers:

- OpenSpec change directories remain the formal implementation planning artifact
- the harness tracker MAY keep a roadmap summary of planned child changes and their readiness state

Recommended harness roadmap summary fields:

- `name`
- `goal`
- `dependsOn`
- `status` (`planned`, `ready`, `active`, `blocked`, `done`)
- `notes`

Rationale:

- OpenSpec remains the authoritative place for each change's implementation artifacts
- the harness tracker can provide a lightweight roadmap summary across multiple changes

### 5. A child change becomes ready only when its prerequisites are met

Ready criteria:

- upstream dependency changes are complete or sufficiently stable
- the child change goal does not duplicate work already implemented elsewhere
- the child change can name a concrete implementation boundary

Rationale:

- prevents premature parallelization that would create rework or spec drift

## Risks / Trade-offs

- [Too many small changes] -> Planning overhead may increase. Mitigation: keep the roadmap to a few meaningful slices, not dozens of micro changes.
- [Dependency drift] -> A later child change may uncover missing foundation assumptions. Mitigation: allow an explicit prerequisite update change rather than silently stretching unrelated scopes.
- [Roadmap staleness] -> Planned changes can become outdated as implementation evolves. Mitigation: update or replace the planning change before starting a dependent child change if assumptions materially shift.
