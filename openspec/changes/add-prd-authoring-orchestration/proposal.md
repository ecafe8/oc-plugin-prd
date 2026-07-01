## Why

The current PRD harness foundation can scaffold documents and persist workflow state, but it does not yet deliver the core experience of turning a user's natural-language project goal into a usable discovery flow and high-quality master PRD. That authoring orchestration layer is the first major product capability the harness needs after the foundation change.

## What Changes

- Add a dedicated discovery and authoring orchestration flow for natural-language project goals.
- Add structured discovery outputs that capture clarified goals, users, constraints, assumptions, and unresolved questions before master PRD drafting.
- Add master PRD drafting and revision orchestration that uses the configured drafting model role and persists authoring state in the tracker.
- Add state-aware tool and workflow behavior so discovery, drafting, and master review progress in a controlled order.

## Capabilities

### New Capabilities
- `project-discovery-orchestration`: Guide the user from a raw natural-language goal through structured discovery outputs and readiness checks for master PRD drafting.
- `master-prd-authoring`: Generate and revise `docs/master-prd.md` from discovery context, workflow state, and user feedback.
- `authoring-context-management`: Persist and reuse structured discovery context, open questions, and authoring notes across drafting and revision loops.

### Modified Capabilities

None.

## Impact

- Extends the harness workflow from scaffolding-only behavior into actual authoring orchestration.
- Introduces structured discovery artifacts and richer tracker/session state for authoring stages.
- Increases the role of drafting model selection and prompt composition in the plugin runtime.
