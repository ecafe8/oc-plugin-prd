## Why

The harness foundation and upcoming authoring/decomposition changes can create documents, but the system still needs a disciplined execution model for review loops. Without a dedicated review-loop change, document quality, revision handling, and gate enforcement will remain shallow and inconsistent across master and feature PRDs.

## What Changes

- Add an execution model for PRD review loops across master and feature artifacts.
- Define how drafting output, structured rule checks, and review-model evaluation combine into a pass/fail decision.
- Add revision-cycle persistence so rejected documents can be revised and re-reviewed with traceable outcomes.
- Add escalation and pause behavior for blocked reviews, unresolved contradictions, or repeated failure.

## Capabilities

### New Capabilities
- `review-loop-orchestration`: Execute structured review loops for PRD artifacts with deterministic transitions between draft, review, revision, and approval.
- `review-decision-persistence`: Persist iteration history, review summaries, retry counts, and escalation status for PRD review cycles.
- `review-escalation-control`: Pause or escalate when repeated failures, contradictions, or insufficient context prevent clean approval.

### Modified Capabilities

None.

## Impact

- Deepens the harness from basic review records into a true review execution system.
- Adds iteration history and escalation state to review tracking.
- Makes later planning and implementation stages depend on richer, more trustworthy review outcomes.
