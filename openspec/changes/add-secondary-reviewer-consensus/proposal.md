## Why

The review loop currently uses one configured review model per iteration. This is simple and predictable, but a single reviewer may miss important contradictions or produce a low-confidence decision for complex, high-risk, or ambiguous artifacts.

Unbounded model-to-model discussion would be expensive and difficult to terminate. A bounded secondary-reviewer consensus mechanism is needed for cases where an independent second opinion adds value, without turning every review into an uncontrolled multi-model conversation.

## What Changes

- Add an optional secondary reviewer role and model configuration.
- Define explicit trigger conditions for invoking a second reviewer.
- Run independent critiques before synthesis rather than allowing free-form model chatter.
- Persist both reviewer opinions, disagreement classification, and the final synthesized decision.
- Escalate unresolved disagreement to the user or a blocked state instead of silently selecting one model's opinion.

## Capabilities

### New Capabilities

- `secondary-reviewer-consensus`: Obtain and synthesize an independent second review when configured or triggered.
- `review-disagreement-resolution`: Classify agreement, material disagreement, and unresolved contradiction with explicit next steps.

### Modified Capabilities

- `review-loop-orchestration`: Add bounded secondary review triggers and synthesis while preserving the primary review loop and iteration limits.
- `configurable-review-iterations`: Use the configured review budget to bound consensus attempts.

## Impact

- Adds optional model configuration and review record fields.
- Increases token and latency cost only for explicitly triggered or high-risk reviews.
- Makes reviewer disagreement visible and auditable.
- Depends on stable review iteration limits and structured discovery clarification so consensus is applied to well-defined artifacts.
