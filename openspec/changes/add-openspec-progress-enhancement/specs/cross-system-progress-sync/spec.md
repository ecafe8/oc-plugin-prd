## ADDED Requirements

### Requirement: The harness SHALL synchronize implementation task state between OpenSpec and the tracker
The harness SHALL keep feature and task progress aligned between OpenSpec implementation artifacts and `.vibe/tracker.yaml`.

#### Scenario: Explicit sync refreshes tracker
- **WHEN** a contributor runs a sync step after OpenSpec implementation progress changes
- **THEN** the harness SHALL refresh the affected feature and task status in the tracker

### Requirement: Cross-system disagreement SHALL be surfaced for reconciliation
The harness SHALL not silently ignore disagreement between OpenSpec task state and tracker state.

#### Scenario: Conflict is detected during sync
- **WHEN** task completion or status differs meaningfully between OpenSpec and tracker records
- **THEN** the harness SHALL surface the discrepancy and preserve the tracker as the authoritative workflow-state source until reconciliation is resolved

### Requirement: Sync SHALL be a no-op when OpenSpec and tracker agree
The harness SHALL avoid unnecessary tracker writes when the OpenSpec and tracker state already match.

#### Scenario: Sync detects no changes and skips writes
- **WHEN** the sync step runs and finds no differences between current OpenSpec task state and tracker task state
- **THEN** the harness SHALL complete without modifying tracker data and report that no changes were required
