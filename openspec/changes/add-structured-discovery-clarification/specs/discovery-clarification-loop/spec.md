## ADDED Requirements

### Requirement: The harness SHALL support repeated clarification rounds before confirmation
Users SHALL be able to add questions, answer questions, defer non-blocking questions, and inspect clarification state across multiple tool calls.

#### Scenario: Multiple clarification rounds update one discovery session
- **WHEN** questions and answers are added across multiple calls
- **THEN** the harness SHALL preserve prior question history and incorporate current answers into discovery context

### Requirement: Resolved answers SHALL be available to PRD authoring
The authoring context SHALL include relevant resolved answers and deferred assumptions from discovery clarification.

#### Scenario: Master PRD prompt includes clarification answers
- **WHEN** discovery is confirmed after questions have been answered
- **THEN** the master PRD authoring context SHALL include those answers
