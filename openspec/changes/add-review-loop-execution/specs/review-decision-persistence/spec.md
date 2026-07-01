## ADDED Requirements

### Requirement: The harness SHALL persist review iteration history
The harness SHALL retain review iteration metadata so contributors can inspect how an artifact progressed through revisions.

#### Scenario: Review history is inspectable
- **WHEN** a document has gone through multiple review attempts
- **THEN** the harness SHALL preserve iteration number, status, summary, and timestamp for each review cycle

### Requirement: Review persistence SHALL distinguish warnings from blockers
The harness SHALL record whether a finding is blocking or advisory so downstream workflow logic can differentiate hard stops from soft guidance.

#### Scenario: Warning does not block progression
- **WHEN** a review returns only warnings and no blocking failures
- **THEN** the harness MAY allow progression according to the configured policy while still preserving the warnings in review records
