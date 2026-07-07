## 1. Wire up the confirmation gate in workflow logic

- [x] 1.1 Add a helper to compute the tri-state drafting readiness (fields incomplete / pending confirmation / confirmed)
- [x] 1.2 Update `mergeDiscoveryContext` to reset `readyForDrafting` to false when core discovery fields change
- [x] 1.3 Confirm `checkDiscoveryReadiness` remains unchanged (field-completeness only) and is reused by the new helper

## 2. Add the `discovery_confirm` tool

- [x] 2.1 Implement `discovery_confirm` tool: reject when fields incomplete, otherwise set `readyForDrafting: true` and `tracker.authoring.discoveryReady: true`
- [x] 2.2 Register the tool in `src/tools/index.ts` and `src/index.ts`
- [x] 2.3 Write the tool description so agents only call it after explicit user confirmation

## 3. Update existing tools to require confirmation

- [x] 3.1 Update `discovery_capture` so `discoveryReady` reflects fields-complete AND confirmed, not fields-complete alone
- [x] 3.2 Update `discovery_update` so `discoveryReady` reflects fields-complete AND confirmed, and confirmation resets on core field changes
- [x] 3.3 Update `discovery_status` output to report the three-state readiness clearly
- [x] 3.4 Update `master_prd_draft` gate message to mention `discovery_confirm` as the next step when pending confirmation

## 4. Tests

- [x] 4.1 Add tests for the tri-state readiness helper
- [x] 4.2 Add tests verifying `mergeDiscoveryContext` resets confirmation on core field changes but not on question-only changes
- [x] 4.3 Add tests for `discovery_confirm` behavior (reject when incomplete, succeed when complete)
- [x] 4.4 Verify full test suite passes after changes

## 5. Review follow-up fixes

- [x] 5.1 Apply the confirmation gate to `master_prd_generate`, which previously advanced the workflow unconditionally without checking `tracker.authoring.discoveryReady`
- [x] 5.2 Fix `mergeDiscoveryContext` to reset confirmation only when merged content actually changes, not merely when a patch field is present (a no-op update, e.g. re-adding an existing actor, must not revoke confirmation)
- [x] 5.3 Add regression tests: `master_prd_generate` gate (blocked/allowed) invoking the real tool, and no-op merge cases that must not reset confirmation
- [x] 5.4 Verify full test suite passes after fixes

