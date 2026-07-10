## Context

Review records already persist `retryCount`, `retryThreshold`, escalation state, iteration history, blockers, warnings, and the review model. The retry threshold is currently defaulted inside review workflow helpers, which makes the behavior predictable but not configurable.

The configuration system already supports workspace and user-level merged settings. Review iteration limits belong under `workflow.review`, with workspace configuration taking precedence over user configuration.

## Goals / Non-Goals

**Goals:**

- Configure maximum review iterations and escalation behavior without changing code.
- Keep limits explicit in review records and prompts.
- Preserve existing escalation and manual intervention semantics.
- Make configuration safe for existing records and workspaces.

**Non-Goals:**

- Automatically revising artifacts without an agent or user decision.
- Removing explicit approval from the review loop.
- Adding multi-model consensus; that belongs to `add-secondary-reviewer-consensus`.
- Modeling discovery clarification; that belongs to `add-structured-discovery-clarification`.

## Decisions

### 1. Configure review limits under `workflow.review`

Proposed configuration:

```yaml
workflow:
  review:
    maxIterations: 3
    escalationAfter: 2
```

Field definitions:

- `workflow.review`: Optional object containing review-loop policy for the workspace.
- `workflow.review.maxIterations`: Positive integer. Maximum total review iterations for one artifact, including approved and failed iterations. Default: `3`.
- `workflow.review.escalationAfter`: Positive integer no greater than `maxIterations`. Number of failed review iterations allowed before escalation. Default: `3`.

Usage:

- Omit `workflow.review` to use defaults.
- Set `maxIterations` higher for complex artifacts that need more revision cycles.
- Set `escalationAfter` lower when unresolved review failures should reach a human quickly.
- These settings apply when a review record is first created; they do not silently change the budget of an existing review.

### 2. Persist effective limits in each review record

When a new review record is created, it SHALL copy the effective configured limits into its loop state. Existing records with missing values SHALL use schema defaults.

Rationale:

- historical records remain interpretable after configuration changes
- a review in progress does not unexpectedly change budget mid-loop

### 3. Keep escalation separate from approval

An artifact SHALL still require an explicit approved review decision. Reaching a limit SHALL produce escalation or blocked state, not automatic approval.

### 4. Surface limits in review context and summary

Review prompts and summaries SHALL show the current iteration, retry count, and effective thresholds so the agent and user understand how much review budget remains.

## Risks / Trade-offs

- [Too many iterations increase cost] -> Mitigation: provide conservative defaults and visible escalation.
- [Too few iterations block useful work] -> Mitigation: workspace configuration allows project-specific limits.
- [Configuration changes create ambiguity] -> Mitigation: snapshot effective limits in each review record.
