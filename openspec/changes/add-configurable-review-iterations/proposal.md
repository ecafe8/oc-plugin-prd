## Why

The review loop currently uses a hard-coded retry threshold of three failures, and the workflow does not expose a user-configurable limit for review iterations. A single draft-review-revision cycle is often insufficient for a complex PRD or feature, while different projects need different limits based on risk, cost, and desired autonomy.

The review loop should support a configurable number of iterations without losing the existing review history, escalation behavior, or safe handoff to human intervention.

## What Changes

- Add workflow configuration for the maximum review iterations and escalation threshold.
- Use configured values when creating new review records and review loop state.
- Preserve a snapshot of the effective thresholds in each review record so later configuration changes do not rewrite historical semantics.
- Keep explicit escalation and blocked outcomes when the configured threshold is exceeded.
- Expose the effective iteration and escalation limits in review context and summaries.

## Capabilities

### New Capabilities

- `configurable-review-iterations`: Configure review iteration and escalation limits per workspace.
- `review-limit-persistence`: Persist effective review limits with each review record for stable history and reproducibility.

### Modified Capabilities

- `review-loop-orchestration`: Replace hard-coded retry behavior with configured limits while retaining explicit approval, revision, escalation, and blocked paths.

## Impact

- Adds review settings under `.vibe/config.yaml`.
- Changes default review state construction to use configured limits.
- Maintains compatibility with existing review records by applying schema defaults when fields are absent.
- Enables later clarification and consensus changes to use a stable review budget.
