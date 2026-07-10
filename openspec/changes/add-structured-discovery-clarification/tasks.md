## 1. Define structured question persistence

- [ ] 1.1 Add schemas for question IDs, text, categories, lifecycle status, blocking flag, and answers
- [ ] 1.2 Decide whether structured questions live in a new YAML store or are rendered into the existing questions artifact
- [ ] 1.3 Preserve backward-compatible reading of existing flat question files where practical
- [ ] 1.4 Document every question field: type, required/optional status, allowed values, blocking semantics, and lifecycle usage

## 2. Add clarification operations

- [ ] 2.1 Add or extend tools to create questions with stable IDs
- [ ] 2.2 Add or extend tools to answer and defer questions by ID
- [ ] 2.3 Render a readable questions summary for users and agents

## 3. Integrate clarification with discovery and authoring

- [ ] 3.1 Include question lifecycle counts and blocking IDs in `discovery_status`
- [ ] 3.2 Block `discovery_confirm` while unresolved blocking questions remain
- [ ] 3.3 Allow confirmation with only non-blocking questions and record deferred uncertainty
- [ ] 3.4 Include resolved answers in master PRD authoring context

## 4. Test and verify

- [ ] 4.1 Test question creation with generated and supplied stable IDs
- [ ] 4.2 Test answering, deferring, and resolving questions by ID
- [ ] 4.3 Test invalid question status, missing answer, and duplicate ID validation
- [ ] 4.4 Test blocking questions prevent confirmation
- [ ] 4.5 Test non-blocking open questions allow explicit confirmation and remain visible
- [ ] 4.6 Test multi-round clarification persistence and answer inclusion in authoring context
- [ ] 4.7 Run the full test suite and verify documentation examples match schema behavior

## 5. Documentation updates

- [ ] 5.1 Update `README.md` with the clarification workflow and complete question-field reference
- [ ] 5.2 Update `README.zh-CN.md` with the corresponding Chinese field definitions and usage examples
- [ ] 5.3 Update `docs/testing.md` with multi-round question, answer, defer, and confirmation scenarios
- [ ] 5.4 Update `docs/testing.zh-CN.md` with the corresponding Chinese test scenarios
