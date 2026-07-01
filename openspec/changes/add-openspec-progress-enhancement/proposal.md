## Why

The PRD harness foundation currently provides a lightweight OpenSpec handoff and tracker synchronization stub, but it does not yet create fully structured OpenSpec changes from approved feature plans or provide robust overall progress aggregation across implementation work. To make the harness useful beyond planning, OpenSpec integration and project progress handling need a dedicated enhancement change.

## What Changes

- Add generation of richer OpenSpec implementation artifacts from reviewed `05-plan.md` feature plans.
- Add stronger synchronization between OpenSpec task state and `.vibe/tracker.yaml` feature/project progress.
- Add conflict detection and reconciliation rules when tracker and OpenSpec state disagree.
- Add aggregated progress views that combine workflow stage, feature readiness, implementation task status, blockers, and replan signals.

## Capabilities

### New Capabilities
- `openspec-change-generation`: Generate or update structured OpenSpec implementation artifacts from approved feature plans.
- `cross-system-progress-sync`: Synchronize implementation task state between OpenSpec artifacts and the harness tracker.
- `project-progress-aggregation`: Produce aggregated progress summaries across planned, active, blocked, replan-required, and complete work.

### Modified Capabilities

None.

## Impact

- Deepens OpenSpec integration from a handoff stub into a real implementation planning bridge.
- Makes tracker state more trustworthy during active implementation.
- Enables better long-running status reporting across multiple features and change requests.
