## Rough Edges Observed During Dogfooding

- The canonical deterministic scenario is assembled from workflow and store primitives rather than from a single top-level orchestration entrypoint. The workflow is testable, but the product still lacks one end-user command path that drives the entire journey directly.
- Multi-feature dependencies are still tracked from candidate metadata and are not yet normalized into a richer cross-feature dependency model after materialization.
- The review-loop agent path remains adjacent to the canonical deterministic happy path rather than fully embedded in it. Recovery hardening should define how rejected or contradictory review-loop results re-enter the baseline flow.

## Follow-up Targets For `add-workflow-recovery-and-idempotence`

- Formalize re-entry rules when a feature plan already exists and a change request arrives.
- Clarify which generation steps are guaranteed rerun-safe versus intentionally strict.
- Expand synchronization guidance for partial completion across multiple active features.
