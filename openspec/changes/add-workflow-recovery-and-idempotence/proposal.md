## Why

End-to-end dogfooding is expected to surface a class of problems that do not show up clearly in slice-oriented tests: rerun ambiguity, state re-entry uncertainty, conflict interpretation, and manual recovery gaps.

The plugin already models complex workflow state across `.vibe/tracker.yaml`, feature artifacts, reviews, change requests, and OpenSpec task synchronization. Once this state exists in real usage, the most costly failures will not be initial generation errors, but cases where partially completed work must be rerun, reconciled, or recovered.

A dedicated hardening change is needed so workflow recovery and idempotence can be formalized based on dogfooding evidence instead of ad hoc fixes.

## What Changes

- Define re-entry rules for key workflow phases.
- Harden repeated execution behavior for selected tools and artifact generation paths.
- Clarify conflict outcomes between tracker state and OpenSpec state.
- Add repair guidance for manual follow-up cases that cannot be auto-resolved safely.

## Capabilities

### New Capabilities
- `workflow-reentry-rules`: Define how partially completed workflow stages can be re-entered after rejection, replan, or interruption.
- `idempotent-workflow-execution`: Define repeat-safe behavior for selected tool executions and artifact generation paths.
- `workflow-conflict-clarity`: Define structured conflict outcomes and repair guidance when cross-system state disagrees.

### Modified Capabilities
- `cross-system-progress-sync`: Extend synchronization behavior to communicate clearer outcomes and repair guidance.

## Impact

- Reduces workflow corruption risk during repeated execution and recovery.
- Makes state disagreement easier to understand and resolve.
- Improves operator confidence when resuming or repairing partially completed work.
