## 1. Add review configuration

- [ ] 1.1 Add `workflow.review.maxIterations` and `workflow.review.escalationAfter` to the config schema with safe defaults
- [ ] 1.2 Validate that limits are positive integers and escalation does not exceed maximum iterations
- [ ] 1.3 Document every review configuration field: path, type, default, allowed range, effect, and example usage

## 2. Integrate limits into review records

- [ ] 2.1 Resolve effective review limits when creating a new review record
- [ ] 2.2 Persist effective limits in review loop state
- [ ] 2.3 Preserve existing review records and schema defaults when limits are absent

## 3. Integrate limits into review execution

- [ ] 3.1 Use configured limits for escalation and blocked outcomes
- [ ] 3.2 Include current limits in review context and summaries
- [ ] 3.3 Ensure approval remains explicit and is never inferred from limit exhaustion

## 4. Test and verify

- [ ] 4.1 Add config schema tests for omitted values and default values
- [ ] 4.2 Add config validation tests for zero, negative, non-integer, and escalation-greater-than-maximum values
- [ ] 4.3 Add review record tests confirming effective limits are persisted at creation time
- [ ] 4.4 Add regression tests proving later config changes do not rewrite an existing review budget
- [ ] 4.5 Add escalation tests using custom limits and verify approval remains explicit
- [ ] 4.6 Run the full test suite and verify documentation examples match schema behavior

## 5. Documentation updates

- [ ] 5.1 Update `README.md` with the review configuration schema, field definitions, defaults, valid ranges, and examples
- [ ] 5.2 Update `README.zh-CN.md` with the same review configuration reference in Chinese
- [ ] 5.3 Update `docs/testing.md` with test steps for custom iteration limits and escalation
- [ ] 5.4 Update `docs/testing.zh-CN.md` with the corresponding Chinese test steps
