## ADDED Requirements

### Requirement: Effective review limits SHALL be persisted with new review records
The harness SHALL persist the effective maximum iteration and escalation values in each newly created review record.

#### Scenario: Review record is created under configured limits
- **WHEN** a new review record is initialized while custom limits are configured
- **THEN** its loop state SHALL contain the effective limits used for that review

#### Scenario: Configuration changes after review begins
- **WHEN** workspace review configuration changes after a review record already has history
- **THEN** the existing review record SHALL retain its persisted limits until the review is completed or explicitly restarted
