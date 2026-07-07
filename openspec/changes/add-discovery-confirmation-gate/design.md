## Context

`discovery_capture` and `discovery_update` already support multiple rounds of input — the data layer merges new goals, actors, constraints, assumptions, and success measures into existing context. What is missing is an explicit checkpoint: readiness for `master_prd_draft` is currently inferred purely from whether required fields are non-empty (`checkDiscoveryReadiness`), with no signal that the user has actually reviewed the discovery summary and agreed discussion is complete.

The discovery schema already includes a `readyForDrafting: boolean` field, but it is never set to `true` by any tool today — it is dead code left over from earlier scaffolding.

## Goals / Non-Goals

**Goals:**

- Add an explicit, user-driven confirmation step before master PRD drafting can begin.
- Preserve the existing multi-round discovery data model (no changes to how goals/actors/constraints accumulate).
- Automatically invalidate a stale confirmation when new discovery content arrives.
- Keep the confirmation gate consistent with existing approval patterns (`feature_review`, `master_prd_review`) — a dedicated tool, not a hidden flag.

**Non-Goals:**

- Modeling discussion turns or conversation history explicitly (no new state machine for "rounds").
- Changing `WORKFLOW_STATES` — discovery still occurs entirely within `project_discovery`.
- Enforcing that the user (rather than the agent) literally typed the confirmation — the harness cannot verify natural-language intent, only provide an explicit tool boundary and instruct agents to use it only after real user confirmation.

## Decisions

### 1. Separate "fields complete" from "confirmed ready"

`checkDiscoveryReadiness` continues to check only field completeness (unchanged, still used for `discovery_update`/`discovery_capture` messaging). A new state, `readyForDrafting` on the discovery context, tracks explicit confirmation. The actual gate used by `master_prd_draft` (`tracker.authoring.discoveryReady`) requires both: `checkDiscoveryReadiness(...).ready && ctx.readyForDrafting`.

Rationale:

- keeps the existing field-completeness messaging useful on its own
- makes the confirmation step additive rather than replacing existing logic

### 2. Confirmation is a dedicated tool, not a flag on an existing tool

Add `discovery_confirm` as a standalone tool with no args. It re-checks field completeness (rejecting confirmation if fields are still missing) and, if satisfied, sets `readyForDrafting: true` on the discovery context and `tracker.authoring.discoveryReady: true`.

Rationale:

- matches the existing convention of explicit, separately-named approval tools (`feature_review`, `master_prd_review`)
- keeps the tool's description text able to instruct the agent clearly: only call this after the user has explicitly confirmed in conversation

### 3. New discovery content resets confirmation

`mergeDiscoveryContext` resets `readyForDrafting` to `false` whenever the patch actually changes `goal`, `actors`, `constraints`, `assumptions`, or `successMeasures`. Merges that only touch questions (resolved/new) do not reset confirmation.

Rationale:

- prevents a confirmation obtained before new information arrived from silently remaining valid
- forces a fresh, explicit re-confirmation whenever the discovery picture materially changes

### 4. Status output reports three distinct states

`discovery_status` (and the return messages from `discovery_capture`/`discovery_update`) distinguish:

- fields incomplete → list missing fields
- fields complete, not yet confirmed → prompt to confirm via `discovery_confirm`
- confirmed → ready to run `master_prd_draft`

Rationale:

- gives the orchestrator agent (and the user, via tool output) an explicit signal of what to do next at each state

## Risks / Trade-offs

- [Existing workspaces regress] -> Workspaces that were previously "ready" under field-only logic will need one explicit `discovery_confirm` call. This is an intentional behavior change, not a bug; it is the entire point of this feature.
- [Agent could still call `discovery_confirm` without genuine user confirmation] -> No tool-level mechanism can literally verify natural-language intent. Mitigated by tool description text and by making the checkpoint explicit and auditable (visible in `.vibe/discovery/context.yaml` and tracker state) rather than implicit.
- [Over-resetting confirmation on trivial updates] -> Any core-field change resets confirmation, which may feel strict for tiny additions. Accepted as the simpler, safer default; can be refined later if it proves too aggressive in practice.
