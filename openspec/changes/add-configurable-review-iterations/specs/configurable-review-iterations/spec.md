## ADDED Requirements

### Requirement: Review iteration limits SHALL be configurable
The harness SHALL support workspace configuration for maximum review iterations and escalation threshold.

#### Scenario: Workspace review limits are configured
- **WHEN** `.vibe/config.yaml` defines `workflow.review.maxIterations` and `workflow.review.escalationAfter`
- **THEN** newly created review records SHALL use those values instead of hard-coded limits

#### Scenario: Review limits are omitted
- **WHEN** review limit configuration is absent
- **THEN** the harness SHALL use safe documented defaults

### Requirement: Review limits SHALL be validated
Configured review limits SHALL be positive integers, and the escalation threshold SHALL not exceed the maximum iteration limit.

#### Scenario: Invalid review limits are configured
- **WHEN** a limit is zero, negative, non-integer, or escalation exceeds the maximum
- **THEN** configuration validation SHALL reject the configuration with an actionable error
