## ADDED Requirements

### Requirement: The harness SHALL classify tracker and OpenSpec disagreement outcomes clearly
Cross-system synchronization SHALL communicate whether a disagreement is a safe update, no-op, explicit conflict, or manual follow-up case.

#### Scenario: OpenSpec-ahead progress produces a safe tracker update
- **WHEN** OpenSpec task state shows completed work that the tracker still marks pending while workflow stage rules remain compatible
- **THEN** the harness SHALL report a safe synchronization update rather than a generic success message

#### Scenario: Tracker-ahead progress produces a conflict result
- **WHEN** the tracker indicates completed work but OpenSpec artifacts still report the task as pending
- **THEN** the harness SHALL report a conflict outcome with enough detail for a human operator to understand what must be reconciled manually

### Requirement: Conflict outcomes SHALL include repair guidance when auto-resolution is unsafe
The harness SHALL provide next-step guidance whenever a disagreement cannot be safely auto-applied.

#### Scenario: Manual follow-up guidance is returned for unresolved disagreement
- **WHEN** synchronization cannot safely resolve cross-system state differences automatically
- **THEN** the harness SHALL describe the relevant mismatch and provide a clear manual follow-up direction
