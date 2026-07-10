## Context

The current review loop has a primary review model, deterministic pre-checks, iteration history, contradiction detection, and escalation. It does not support independent second opinions or a formal synthesis step.

The purpose of a secondary reviewer is not to create an open-ended debate. It is to produce an independent critique, compare it with the primary critique, and either synthesize a clear decision or ask for human intervention when disagreement is material.

## Goals / Non-Goals

**Goals:**

- Make secondary review optional and bounded.
- Trigger it only when it is likely to improve decision quality.
- Preserve independent reviewer outputs before synthesis.
- Classify disagreement explicitly.
- Reuse configured iteration and escalation limits.

**Non-Goals:**

- Running multiple reviewers for every artifact by default.
- Allowing reviewers to call each other recursively.
- Automatically approving an artifact when reviewers disagree.
- Replacing user approval for high-impact or unresolved decisions.

## Decisions

### 1. Configure a secondary reviewer as an optional role

Proposed configuration:

```yaml
models:
  review:
    model: github-copilot/gpt-5.4
  secondaryReview:
    model: github-copilot/claude-sonnet-5

workflow:
  review:
    secondaryReviewer: on_disagreement
    maxConsensusAttempts: 1
```

Field definitions:

- `models.secondaryReview`: Optional model-role object used for independent secondary critique.
- `models.secondaryReview.model`: Required `provider/model` string when `models.secondaryReview` is present. Verify IDs with `list_models` or `opencode models`.
- `workflow.review.secondaryReviewer`: Trigger policy. Allowed values: `never`, `on_disagreement`, `on_contradiction`, or `always`. Default: `never`.
- `workflow.review.maxConsensusAttempts`: Positive integer limiting additional consensus passes after the initial independent critiques. Default: `1`.

Usage:

- Use `never` for ordinary low-risk reviews and lowest cost.
- Use `on_disagreement` for a second opinion only when primary findings conflict with the decision.
- Use `on_contradiction` for artifacts that contradict existing project context.
- Use `always` only when every review requires two independent models and the extra latency/cost is acceptable.
- Set `maxConsensusAttempts` to `1` initially; raise it only when a bounded extra synthesis pass is justified.

Supported trigger policies SHOULD include:

- `never`
- `on_disagreement`
- `on_contradiction`
- `always` (explicit opt-in, not default)

### 2. Reviewers critique independently

The primary and secondary reviewers SHALL receive the artifact and review rules, but not each other's critique, during their independent pass.

Rationale:

- reduces anchoring bias
- makes disagreement meaningful
- avoids conversational token loops

### 3. Synthesis is structured and bounded

A synthesis step SHALL compare statuses, blockers, warnings, and contradiction signals. It SHALL produce one of:

- `agreed_approved`
- `agreed_revision`
- `material_disagreement`
- `unresolved_contradiction`

At most the configured number of consensus attempts may run before escalation.

### 4. Disagreement is never silently discarded

When reviewers materially disagree, the record SHALL preserve both opinions and provide a user-facing explanation and next action. The system SHALL not silently choose the primary reviewer merely because it ran first.

## Data Flow

```text
artifact
   ├── deterministic pre-checks
   ├── primary reviewer ─────┐
   └── secondary reviewer ───┼── structured synthesis
                             │
                 agreement ─┴─> normal review decision
                 disagreement ─> user / escalation
```

## Risks / Trade-offs

- [Higher cost and latency] -> Mitigation: trigger only on configured conditions and cap consensus attempts.
- [False disagreement from different wording] -> Mitigation: synthesize against structured blockers and statuses, not raw prose similarity.
- [Consensus model becomes a hidden decision-maker] -> Mitigation: preserve both critiques and require explicit policy for final decisions.
