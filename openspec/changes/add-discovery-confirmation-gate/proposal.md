## Why

Discovery readiness is currently computed purely from field completeness: as soon as `goal`, `actors`, and `successMeasures` are non-empty, `master_prd_draft` is unblocked. There is no explicit checkpoint requiring the user to confirm that discussion is actually complete before PRD drafting begins.

In practice, a user often cannot fully describe requirements in a single turn. Multiple rounds of `discovery_capture`/`discovery_update` may be needed, and the user should explicitly confirm readiness before the harness proceeds to draft the master PRD — mirroring the explicit approval pattern already used for `feature_review` and `master_prd_review`.

The schema already defines a `readyForDrafting` field on the discovery context (`schemas/discovery.ts`), but no tool currently sets it. This change wires up that field as an explicit, user-driven confirmation gate.

## What Changes

- Add a `discovery_confirm` tool that the agent calls only after the user has explicitly confirmed discovery is complete.
- Require both field completeness AND explicit confirmation before `master_prd_draft` proceeds.
- Reset confirmation automatically when new discovery content is merged via `discovery_update`, so a stale confirmation cannot silently cover updated content.
- Update `discovery_status` output to distinguish three states: fields incomplete, fields complete but unconfirmed, and confirmed.

## Capabilities

### New Capabilities

- `discovery-confirmation-gate`: Require explicit user confirmation, in addition to field completeness, before discovery is considered ready for master PRD drafting.

### Modified Capabilities

- `project-discovery-orchestration`: The existing "Discovery SHALL expose readiness for master PRD drafting" requirement is modified so readiness also depends on explicit confirmation, not field completeness alone.

## Impact

- Prevents the harness from drafting a master PRD immediately after a single message, even if required fields happen to be filled in.
- Makes the "discussion is complete" checkpoint explicit, discoverable, and auditable, consistent with other approval gates in the harness.
- Existing workspaces with discovery context that was previously considered "ready" under the old field-only logic will require one explicit `discovery_confirm` call before drafting can proceed.
