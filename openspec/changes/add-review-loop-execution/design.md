## Context

The foundation change introduced review records and basic approval gating, and the upstream child changes will provide richer discovery and feature decomposition inputs. The next missing piece is execution: the harness needs a deterministic review loop that can repeatedly evaluate documents, record outcomes, drive revisions, and stop when escalation is needed.

This change does not introduce feature decomposition or OpenSpec project aggregation itself. It focuses on the lifecycle of review and revision.

## Goals / Non-Goals

**Goals:**

- Define the review-loop execution model for master and feature PRD artifacts.
- Define how rule checks and review-model outputs combine into structured decisions.
- Persist revision history and retry state.
- Define escalation behavior after repeated failure or contradictory context.

**Non-Goals:**

- OpenSpec implementation progress tracking.
- UI dashboards for review results.
- General-purpose human approval workflow outside PRD review and revision.

## Decisions

### 1. Review execution combines rule evaluation and model-based critique

Each review loop SHALL run in two layers:

1. deterministic structure/rule evaluation
2. review-model critique and decision synthesis

Rationale:

- deterministic checks catch obvious structural failures cheaply
- model critique handles semantic quality and inconsistency analysis

### 2. Review loops are iterative and revision-aware

The harness SHALL record every review iteration and support explicit re-review after document updates.

Minimum iteration fields:

- artifact identifier
- iteration number
- decision status
- summary
- blocking findings
- timestamp

Rationale:

- avoids losing decision history between revisions

### 3. Repeated failure can escalate the workflow

The harness SHALL define escalation triggers such as:

- repeated failed reviews beyond a configured threshold
- contradictory inputs between discovery, master PRD, and feature artifacts
- unresolved questions that block review completion

Escalation targets MAY include:

- pause for user clarification
- mark the artifact blocked
- mark the broader workflow blocked

The default escalation behavior SHALL be to pause for user clarification when a retry threshold is exceeded, and to mark the artifact blocked if no user response resolves the contradiction within the same session.

Rationale:

- prevents the system from looping indefinitely with no resolution path

### 4. Master and feature review loops share the same execution contract but different check sets

The review engine SHALL use a common loop structure while selecting document-specific checks according to artifact type.

Rationale:

- keeps the system consistent while preserving artifact-specific review quality

## Risks / Trade-offs

- [Too much loop overhead] -> Review cycles could slow perceived velocity. Mitigation: use deterministic pre-checks and concise review summaries.
- [Weak escalation] -> The system may continue revising hopeless drafts. Mitigation: enforce explicit retry thresholds and blocked states.
- [Overly harsh critique] -> Review output could over-block progress. Mitigation: distinguish warnings from blocking failures and make thresholds configurable.
