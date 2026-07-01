## Context

The foundation change implemented the runtime skeleton for the PRD harness, including schemas, stores, scaffolding, and basic review and planning tools. However, it stops short of the core product promise: a user should be able to describe a project in natural language and have the harness drive discovery, clarify uncertainties, and produce a high-quality master PRD that is ready for review.

This change focuses on the authoring orchestration layer before feature decomposition. It does not attempt to split features or execute implementation planning beyond the master PRD stage.

## Goals / Non-Goals

**Goals:**

- Define a structured discovery workflow for raw project goals.
- Persist discovery outputs in reusable, machine-readable form.
- Generate and revise `docs/master-prd.md` from discovery context.
- Move the workflow cleanly through `project_discovery`, `master_prd_drafting`, and `master_prd_review`.
- Respect the configured drafting model role when performing authoring steps.

**Non-Goals:**

- Feature decomposition.
- Feature-level PRD authoring.
- Review-loop multi-model escalation logic beyond what is necessary to support master PRD revision entry points.
- OpenSpec implementation handoff.

## Decisions

### 1. Discovery output is a first-class artifact set

The harness SHALL persist structured discovery context before generating the master PRD.

Recommended discovery artifacts:

- `.vibe/discovery/summary.md`
- `.vibe/discovery/context.yaml`
- `.vibe/discovery/questions.md`

Responsibilities:

- `summary.md`: concise prose summary of the project goal and clarified intent
- `context.yaml`: machine-readable fields such as goals, actors, constraints, assumptions, and success metrics
- `questions.md`: unresolved or deferred questions that still matter to downstream drafting and review

Rationale:

- natural-language discussion needs a durable structured form before PRD generation
- the authoring loop needs reusable context across multiple drafting passes

### 2. Discovery readiness gates determine whether master drafting can begin

The harness SHALL evaluate whether discovery is sufficient before transitioning into `master_prd_drafting`.

Minimum readiness checks:

- project goal is concrete enough to summarize
- primary users or actors are identified or explicitly marked unknown
- major constraints are identified or explicitly empty
- top-level success measures are available or marked provisional

Rationale:

- avoids drafting a master PRD from an underspecified conversation

### 3. Master PRD authoring is an orchestrated drafting loop, not a one-shot write

The harness SHALL support:

- initial master PRD generation
- revision from user feedback
- revision from review feedback
- preservation of authoring notes and prior discovery context

Rationale:

- the master PRD should improve iteratively instead of being overwritten without traceability

### 4. Drafting context is assembled from layered sources

The harness SHALL compose authoring prompts from these layers:

1. structured discovery context
2. workflow state and tracker summary
3. existing master PRD contents when revising
4. explicit user feedback or change requests

Rationale:

- keeps authoring deterministic and easier to debug
- avoids hidden prompt state

### 5. Authoring state should be visible in tracker and session data

The tracker and session state SHALL record at least:

- last discovery update timestamp
- whether discovery is ready for drafting
- last master PRD draft timestamp
- pending unresolved discovery questions count

Rationale:

- provides resumability and state visibility across authoring sessions

## Risks / Trade-offs

- [Over-questioning] -> Discovery can become slow if the harness asks too many clarifying questions. Mitigation: record provisional assumptions and continue when ambiguity is tolerable.
- [Weak discovery structure] -> Poorly normalized context can make drafting low quality. Mitigation: define explicit discovery schema fields and readiness checks.
- [Revision churn] -> Repeated master PRD rewrites can lose stable intent. Mitigation: preserve discovery context and revision reasons outside the document body.

## Discovery Directory Layout

The authoring change introduces `.vibe/discovery/` as an extension of the `.vibe/` runtime directory established in the foundation change.

```text
.vibe/
  config.yaml
  tracker.yaml
  sessions/
  reviews/
  changes/
  discovery/
    summary.md
    context.yaml
    questions.md
  logs/
```
