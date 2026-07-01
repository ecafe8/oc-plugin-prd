## ADDED Requirements

### Requirement: The harness SHALL escalate or pause after repeated unresolved review failure
The harness SHALL prevent infinite revision loops by escalating or pausing when retry thresholds or contradiction thresholds are exceeded.

#### Scenario: Retry threshold triggers escalation
- **WHEN** a PRD artifact exceeds the configured number of failed review iterations without approval
- **THEN** the harness SHALL mark the review as escalated or blocked and require explicit user intervention or a broader workflow decision

### Requirement: Contradictory context SHALL block silent approval
The harness SHALL stop review progression when key artifacts disagree on scope, actors, or delivery constraints in a way that cannot be reconciled automatically.

#### Scenario: Contradictory inputs pause the loop
- **WHEN** discovery context, master PRD, or feature PRDs contain conflicting information that changes the meaning of the artifact under review
- **THEN** the harness SHALL block approval and surface the contradiction for resolution
