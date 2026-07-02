## Why

The plugin now has broad workflow coverage across discovery, PRD authoring, decomposition, review, planning, OpenSpec generation, and progress reporting. However, current verification is still mostly slice-oriented.

What is still missing is proof that a realistic end-to-end user journey works as a coherent whole:

- from a goal
- through authoring and decomposition
- into review and planning
- then into OpenSpec generation, sync, and progress reporting

Without this dogfooding layer, product documentation risks describing an idealized workflow rather than a validated one. Recovery and idempotence work also risks becoming speculative instead of evidence-driven.

A dedicated dogfooding change is needed to establish a canonical end-to-end workflow baseline.

## What Changes

- Add one or more end-to-end workflow scenarios that validate the plugin as a complete user journey.
- Verify state transitions across the canonical workflow.
- Verify the expected artifacts created in `.vibe/*`, `docs/features/*`, and `openspec/changes/*`.
- Verify repeatability and no-op behavior in selected phases of the workflow.
- Surface rough edges that should feed the next hardening change.

## Capabilities

### New Capabilities
- `end-to-end-workflow-validation`: Validate a complete PRD harness workflow from goal capture to OpenSpec progress.
- `workflow-artifact-baseline`: Define the expected artifact and state baseline for canonical plugin usage.
- `workflow-repeatability-validation`: Verify that selected repeated operations remain stable and predictable.

### Modified Capabilities
- `workflow-integration-testing`: Extend integration coverage from isolated state slices to full-chain workflow validation.

## Impact

- Establishes a real workflow truth source for future docs and hardening.
- Exposes state-machine gaps, missing artifacts, and unstable re-entry behavior early.
- Provides a repeatable canonical scenario for future regression testing.
