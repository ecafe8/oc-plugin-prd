## 1. Add review-loop state and history

- [x] 1.1 Extend review schemas and stores to record iteration history, retry counts, warnings, blockers, and escalation state
- [x] 1.2 Add workflow helpers that create new review iterations for master and feature artifacts

## 2. Implement loop execution behavior

- [x] 2.1 Add deterministic pre-check execution before review-model critique
- [x] 2.2 Resolve the configured review model role and apply safe fallback before executing review-model critique
- [x] 2.3 Add review-model execution and decision synthesis for master and feature artifacts
- [x] 2.4 Add explicit revision-loop handling so failed artifacts must re-enter review after edits

## 3. Add escalation control

- [x] 3.1 Add configurable retry-threshold and contradiction detection behavior for review loops
- [x] 3.2 Add default escalation path: pause for user clarification on threshold breach, block artifact if unresolved in session
- [x] 3.3 Add blocked/escalated workflow outcomes and user-facing summaries for unresolved review failure

## 4. Validate review-loop behavior

- [x] 4.1 Add tests for approval, revision, warning-only, and blocked review paths
- [x] 4.2 Add tests for iteration history persistence and retry counting
- [x] 4.3 Add tests for review model role resolution and fallback behavior
- [x] 4.4 Add tests for escalation triggered by repeated failure or contradictory context
