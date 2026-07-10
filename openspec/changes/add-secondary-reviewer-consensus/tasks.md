## 1. Define configuration and trigger policy

- [ ] 1.1 Add optional `models.secondaryReview.model` configuration using `provider/model` validation guidance
- [ ] 1.2 Add `workflow.review.secondaryReviewer` policy and `workflow.review.maxConsensusAttempts` limit
- [ ] 1.3 Define trigger conditions for disagreement, contradiction, high-risk artifacts, and explicit user request
- [ ] 1.4 Document every consensus configuration field: type, default, allowed values, trigger semantics, and cost/latency implications

## 2. Add independent secondary review

- [ ] 2.1 Add a secondary review execution boundary that receives artifact context independently
- [ ] 2.2 Persist primary and secondary outputs separately in review history
- [ ] 2.3 Bound secondary review execution using configurable consensus limits

## 3. Add structured synthesis and escalation

- [ ] 3.1 Implement agreement and disagreement classification
- [ ] 3.2 Merge agreed revision findings without duplicates
- [ ] 3.3 Return user-facing disagreement explanation and next action
- [ ] 3.4 Escalate unresolved disagreement without silently choosing one result

## 4. Test and verify

- [ ] 4.1 Test `never`, `on_disagreement`, `on_contradiction`, and `always` policies
- [ ] 4.2 Test missing and invalid secondary model configuration
- [ ] 4.3 Test independent output persistence and all synthesis statuses
- [ ] 4.4 Test that the secondary reviewer cannot see primary critique before its own result is recorded
- [ ] 4.5 Test consensus budget exhaustion and escalation
- [ ] 4.6 Test that reviewer disagreement is never silently resolved by choosing the primary result
- [ ] 4.7 Run the full test suite and verify documentation examples match schema behavior

## 5. Documentation updates

- [ ] 5.1 Update `README.md` with all secondary-reviewer fields, defaults, policies, and usage examples
- [ ] 5.2 Update `README.zh-CN.md` with the corresponding Chinese configuration reference
- [ ] 5.3 Update `docs/testing.md` with disabled, triggered, agreement, disagreement, and escalation test scenarios
- [ ] 5.4 Update `docs/testing.zh-CN.md` with the corresponding Chinese test scenarios
