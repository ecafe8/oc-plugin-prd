## Why

The discovery layer supports repeated capture and update calls, but open questions are currently stored as plain Markdown lines. The workflow cannot distinguish blocking questions from optional questions, cannot give each question a stable identity, and cannot preserve answers as structured context.

As a result, users may be pushed toward PRD drafting before important ambiguities are resolved, or may be blocked by questions that could safely remain provisional. A structured clarification loop is needed before the user confirms discovery readiness.

## What Changes

- Replace plain question-only tracking with structured discovery questions that have IDs, categories, status, blocking state, and optional answers.
- Add tools or tool arguments for proposing, answering, resolving, and listing discovery questions.
- Make blocking unanswered questions visible in discovery status and prevent confirmation while they remain unresolved.
- Preserve non-blocking questions as assumptions or follow-up items when the user explicitly chooses to proceed.
- Include resolved answers in the discovery context used by master PRD drafting.

## Capabilities

### New Capabilities

- `structured-discovery-questions`: Persist discovery questions with stable identity, category, status, blocking state, and answers.
- `discovery-clarification-loop`: Support repeated question-and-answer rounds before explicit discovery confirmation.
- `discovery-question-gating`: Prevent confirmation when unresolved blocking questions remain while allowing explicit progress with non-blocking questions.

### Modified Capabilities

- `discovery-confirmation-gate`: Use structured blocking-question state as an additional confirmation condition.
- `project-discovery-orchestration`: Feed resolved question answers into discovery context and authoring prompts.

## Impact

- Changes `.vibe/discovery/questions.md` from a flat list into a structured, human-readable question record format or adds a companion structured file.
- Adds question lifecycle semantics and more informative status output.
- Gives the orchestrator a durable basis for multi-turn requirement clarification.
