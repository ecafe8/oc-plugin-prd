## 1. Add discovery artifacts and schema support

- [x] 1.1 Define schemas and stores for discovery summary, discovery context, and unresolved questions
- [x] 1.2 Add `.vibe/discovery/` artifact layout and persistence helpers
- [x] 1.3 Extend tracker and session state with authoring-specific metadata such as discovery readiness and draft timestamps

## 2. Implement discovery orchestration

- [x] 2.1 Add a `discovery_capture` tool that accepts a natural-language project goal and persists initial discovery context artifacts
- [x] 2.2 Add workflow helpers that normalize discovery input into structured discovery context
- [x] 2.3 Add readiness checks that determine whether discovery can transition into master PRD drafting
- [x] 2.4 Add a `discovery_update` tool that merges additional goals, actors, or constraints into existing discovery context
- [x] 2.5 Expose discovery status and missing inputs to the user through tool output or workflow prompts

## 3. Implement master PRD authoring orchestration

- [x] 3.1 Add prompt/context assembly for master PRD drafting from discovery artifacts, tracker state, and existing drafts
- [x] 3.2 Add workflow steps for initial master PRD generation and revision-based updates
- [x] 3.3 Add a workflow step that advances the workflow to `master_prd_review` when a draft is ready
- [x] 3.4 Persist authoring metadata needed to resume drafting after interruption or review feedback

## 4. Connect drafting model configuration

- [x] 4.1 Resolve the configured drafting model role before executing discovery synthesis and master PRD drafting steps
- [x] 4.2 Apply safe fallback to OpenCode default model when no drafting model is configured
- [x] 4.3 Add tests for discovery readiness and clarification mode
- [x] 4.4 Add tests for discovery context update merging
- [x] 4.5 Add tests for authoring state restoration and forward/backward workflow transitions
- [x] 4.6 Add tests for drafting model resolution and fallback behavior
