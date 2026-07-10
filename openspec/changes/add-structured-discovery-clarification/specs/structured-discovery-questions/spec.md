## ADDED Requirements

### Requirement: Discovery questions SHALL have stable structured records
The harness SHALL persist each discovery question with a stable ID, question text, category, status, and blocking flag.

#### Scenario: A clarification question is created
- **WHEN** a new discovery question is added
- **THEN** the harness SHALL assign or accept a stable question ID and persist its metadata

#### Scenario: A question is answered by ID
- **WHEN** the user provides an answer for a question ID
- **THEN** the harness SHALL persist the answer and update that question's lifecycle status without relying on text matching

### Requirement: Discovery status SHALL summarize question lifecycle
The harness SHALL report counts and details for open, answered, deferred, and blocking questions.

#### Scenario: Discovery has unresolved blocking questions
- **WHEN** discovery status is requested
- **THEN** the output SHALL identify the blocking questions that prevent confirmation
