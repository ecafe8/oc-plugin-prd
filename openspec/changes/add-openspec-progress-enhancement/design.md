## Context

The foundation change added a lightweight mapping from `05-plan.md` tasks into OpenSpec-oriented handoff output and a basic synchronization helper. Later child changes will improve authoring, decomposition, and review quality. Once those upstream artifacts are richer, the harness needs a stronger implementation-phase bridge that can generate meaningful OpenSpec changes and keep total project progress coherent.

This change focuses on implementation-phase orchestration and status aggregation rather than earlier drafting behavior.

## Goals / Non-Goals

**Goals:**

- Generate structured OpenSpec implementation artifacts from approved feature plans.
- Synchronize task and feature progress between OpenSpec and `.vibe/tracker.yaml`.
- Detect and reconcile cross-system inconsistencies.
- Provide richer progress snapshots across the full project.

**Non-Goals:**

- Replacing OpenSpec with a custom implementation tracker.
- Building a visual dashboard.
- Reworking upstream PRD authoring or review semantics.

## Decisions

### 1. Approved feature plans are the source input for OpenSpec generation

The harness SHALL derive implementation-phase OpenSpec artifacts from approved `05-plan.md` content and associated feature metadata.

Rationale:

- ensures implementation work remains grounded in reviewed planning artifacts

### 2. Synchronization is explicit and event-friendly

The harness SHOULD support both:

- explicit sync commands or workflow steps
- sync after known implementation-phase updates

Rationale:

- allows deterministic sync in environments without live event streams
- still supports tighter coupling later if hooks are available

### 3. The harness tracker remains authoritative for overall workflow status

When tracker and OpenSpec disagree, the harness tracker SHALL remain authoritative for workflow stage, while task-level discrepancies must be surfaced for reconciliation.

Rationale:

- keeps the PRD harness lifecycle from being captured by implementation-only state

### 4. Progress aggregation must include blockers and replan signals

The progress layer SHALL summarize more than completion counts. It SHALL include:

- workflow state
- feature readiness counts
- active implementation counts
- blocked items
- replan-required items
- outstanding change requests

Rationale:

- project leadership needs actionable status, not just done percentages

## Risks / Trade-offs

- [Over-coupling to OpenSpec shape] -> OpenSpec artifact assumptions could become brittle. Mitigation: isolate generation logic in adapters and keep mapping explicit.
- [Sync drift] -> Long-running implementation may drift from harness state. Mitigation: add clear sync triggers and reconciliation visibility.
- [Progress noise] -> Too much status detail can obscure important blockers. Mitigation: prioritize blocked and replan-required items in summaries.
