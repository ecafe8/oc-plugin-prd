## ADDED Requirements

### Requirement: Unresolved blocking questions SHALL prevent discovery confirmation
The confirmation gate SHALL reject confirmation while any blocking question remains open.

#### Scenario: Confirmation is attempted with an open blocking question
- **WHEN** `discovery_confirm` is called and at least one blocking question has status `open`
- **THEN** confirmation SHALL be rejected and the blocking question IDs SHALL be reported

### Requirement: Non-blocking questions MAY remain unresolved at confirmation
The confirmation gate SHALL allow explicit progress when only non-blocking questions remain open, while clearly reporting them as deferred uncertainty.

#### Scenario: User confirms with only non-blocking questions open
- **WHEN** all required fields are complete, no blocking questions remain open, and non-blocking questions are still open
- **THEN** confirmation SHALL succeed and the status output SHALL report the deferred questions
