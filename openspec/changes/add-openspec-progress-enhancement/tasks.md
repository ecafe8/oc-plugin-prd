## 1. Improve OpenSpec generation

- [x] 1.1 Extend the current OpenSpec handoff adapter into structured change-generation logic from approved feature plans
- [x] 1.2 Preserve source feature identity, rationale, and planning references in generated OpenSpec artifacts
- [x] 1.3 Implement update-in-place behavior when an OpenSpec artifact already exists for a feature

## 2. Improve synchronization and reconciliation

- [x] 2.1 Add explicit sync workflows that refresh tracker task and feature state from OpenSpec progress
- [x] 2.2 Add no-op detection so sync skips tracker writes when state already agrees
- [x] 2.3 Add discrepancy detection and reconciliation reporting when tracker and OpenSpec state disagree
- [x] 2.4 Preserve tracker authority for workflow stage while still exposing task-level sync conflicts

## 3. Improve progress aggregation

- [x] 3.1 Extend progress summaries to include workflow stage, active work, blocked work, replan-required work, and change-request impact
- [x] 3.2 Add tests for OpenSpec artifact generation and update-in-place behavior
- [x] 3.3 Add tests for sync no-op detection and conflict reporting
- [x] 3.4 Add tests for aggregate progress output including blockers and replan-required items
