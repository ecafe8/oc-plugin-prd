# oc-plugin-prd

An [OpenCode](https://opencode.ai) plugin that turns a natural-language product goal into a tracked, reviewable, and implementation-ready feature set.

The plugin drives a structured workflow: **discovery → PRD authoring → feature decomposition → review → planning → OpenSpec generation → progress tracking**. At each stage, the plugin writes real files to your workspace and persists workflow state so work can be resumed, inspected, and recovered at any point.

---

## What it does

- Captures product goals, actors, constraints, and success measures through structured discovery
- Drafts and reviews a master PRD document
- Decomposes the approved PRD into feature candidates with dependency awareness
- Runs structured review loops for each feature before any implementation begins
- Generates implementation plans as trackable task lists
- Produces and synchronises OpenSpec change artifacts from approved plans
- Reports workflow and task progress across multiple features

---

## Installation

Add the plugin to your OpenCode configuration:

```jsonc
// ~/.config/opencode/config.json
{
  "plugins": ["path/to/oc-plugin-prd/dist/index.js"]
}
```

Build the plugin before first use:

```bash
bun install
bun run build
```

The plugin requires [Bun](https://bun.sh) v1.3 or later and TypeScript 6.

---

## Configuration

The plugin reads configuration from two sources, merged at runtime. Workspace config takes precedence over user config.

### Workspace config — `.vibe/config.yaml`

Create this file in your project root before running any PRD workflow tools:

```yaml
models:
  drafting:
    model: claude-opus-4-5  # model used for PRD and feature authoring
  review:
    model: claude-sonnet-4-5  # model used for structured review critique

workflow:
  autoSyncOpenSpec: true         # sync OpenSpec on plan generation
  configErrorSeverity: block     # block or warn when config is missing
```

Both `models.drafting` and `models.review` are optional. When absent the plugin falls back to the OpenCode default model.

`configErrorSeverity: block` (default) causes all PRD tools to refuse to run when `.vibe/config.yaml` is missing or invalid. Set to `warn` to allow the workflow to proceed with warnings instead.

### User config — `~/.config/opencode/oc-plugin-prd.jsonc`

Optional user-level overrides. Workspace config takes precedence over this file for any field both define.

```jsonc
{
  "models": {
    "drafting": { "model": "claude-opus-4-5" }
  }
}
```

---

## Core concepts

The plugin maintains two separate artifact layers that work together but have distinct responsibilities.

### Tracker — `.vibe/tracker.yaml`

The tracker is the **authoritative source for workflow stage**. It records:

- the current workflow state (e.g. `feature_review`, `implementation_ready`)
- the list of features and their statuses
- task records attached to each feature
- change requests and the active change request ID

The tracker never loses to OpenSpec on workflow stage questions. If OpenSpec and the tracker disagree about which stage the work is in, the tracker wins.

### OpenSpec — `openspec/changes/`

OpenSpec change files are the **authoritative source for implementation task progress**. They record:

- which implementation tasks are marked done
- feature traceability (source feature ID, title, plan reference)
- dependency links between features

When `openspec_sync` is run, task-level completions recorded in OpenSpec are applied to the tracker. The tracker's workflow stage is never overwritten by this sync.

### Discovery artifacts — `.vibe/discovery/`

| File | Purpose |
|------|---------|
| `context.yaml` | Structured goal, actors, constraints, assumptions, success measures |
| `summary.md` | Human-readable discovery summary for PRD authoring prompts |
| `questions.md` | Open questions captured during discovery |

### Feature artifacts — `docs/features/feat-<slug>/`

Each materialized feature has its own directory:

| File | Purpose |
|------|---------|
| `index.md` | Feature identity, source traceability, dependency links |
| `01-foundation.md` | Problem framing and scope |
| `02-product.md` | Product requirements |
| `03-ui-ux.md` | UI/UX requirements (optional) |
| `04-technical.md` | Technical requirements |
| `05-plan.md` | Implementation task list |
| `review.yaml` | Review record (decision, history, loop state) |

### Other tracked paths

| Path | Purpose |
|------|---------|
| `docs/master-prd.md` | Master PRD document |
| `.vibe/candidates.yaml` | Pending feature candidates awaiting confirmation |
| `.vibe/reviews/` | Indexed review records by feature ID |
| `.vibe/changes/` | Change request directories |

---

## Canonical workflow

The plugin exposes two agents:

- **orchestrator** — coordinates the workflow and selects the right tools for the current state (primary mode)
- **reviewer** — evaluates PRD artifacts against structured quality gates (subagent mode)

Work through these phases in order. Each phase produces file artifacts that the next phase consumes.

### Phase 1 — Discovery

**Goal**: capture enough structured context to draft a coherent PRD.

Tools: `discovery_capture`, `discovery_update`, `discovery_status`

```
discovery_capture
  args: goal, actors, constraints, assumptions, successMeasures
  writes: .vibe/discovery/context.yaml
          .vibe/discovery/summary.md

discovery_status
  returns: readiness check — missing fields block advancement
```

Discovery is ready when `goal`, `actors`, and `successMeasures` are all present. Open questions do not block readiness but are surfaced in the status output.

### Phase 2 — Master PRD authoring

**Goal**: produce a reviewed and approved master PRD document.

Tools: `master_prd_draft`, `master_prd_submit`, `master_prd_review`

```
master_prd_draft
  without content arg: returns authoring prompt for the drafting model
  with content arg:    writes docs/master-prd.md
                       advances workflow → master_prd_drafting

master_prd_submit
  requires: docs/master-prd.md exists
  advances workflow → master_prd_review

master_prd_review
  args: approved (bool), summary
  writes: .vibe/reviews/master-prd.yaml
  if approved:  advances workflow → feature_splitting
  if rejected:  routes back     → master_prd_drafting
```

### Phase 3 — Feature decomposition

**Goal**: split the approved PRD into confirmed, materialized feature directories.

Tools: `feature_candidates_generate`, `feature_candidates_materialize`

```
feature_candidates_generate
  requires: master PRD review approved
  args: masterPrdReviewPath, candidates[]
  writes: .vibe/candidates.yaml
  output: candidate list for user confirmation

feature_candidates_materialize
  args: confirmedSlugs[]
  reads: .vibe/candidates.yaml
  writes: docs/features/feat-<slug>/ for each confirmed candidate
  advances workflow → feature_splitting
```

Candidates not included in `confirmedSlugs` are discarded. Dependency relationships between candidates are recorded in each feature's `index.md`.

### Phase 4 — Feature review

**Goal**: approve each feature for implementation planning.

Tools: `feature_review`

```
feature_review
  args: featureId, approved (bool), summary
  writes: docs/features/<id>/review.yaml
          .vibe/reviews/<id>.yaml
  if approved:  feature status → awaiting_confirmation
                workflow      → awaiting_user_confirmation
  if rejected:  feature status → in_review
                workflow      → feature_review
```

Rejected features re-enter a controlled revision path. The feature documents are preserved; only a new review iteration is required before the feature can advance. The review history accumulates across iterations.

### Phase 5 — Implementation planning

**Goal**: generate a structured task list for each approved feature.

Tools: `plan_generate`

```
plan_generate
  args: featureId, steps[]
  requires: feature review approved
  guard:    blocked if feature is already implementation_in_progress or done
  writes: docs/features/<id>/05-plan.md
  updates: tracker feature tasks
  advances: feature status → implementation_ready
            workflow       → implementation_ready
```

The plan is idempotent for the same inputs. If a feature is already `implementation_in_progress`, the tool blocks the call and returns a clear message — use `change_request_apply` to record a scope change instead.

### Phase 6 — OpenSpec generation and sync

**Goal**: create and maintain OpenSpec implementation artifacts from approved plans.

Tools: `openspec_generate`, `openspec_sync`

```
openspec_generate
  args: featureId
  requires: feature status is implementation_ready or implementation_in_progress
  writes or updates: openspec/changes/<featureId>.md
  if new file:     isUpdate = false, feature → implementation_in_progress
  if update:       isUpdate = true, update-in-place (no duplication)

openspec_sync
  args: featureId, taskDoneIds[]
  reads: openspec/changes/<featureId>.md
  compares: OpenSpec task state vs tracker task state
  outcome kinds:
    no_op         — systems already agree, no writes needed
    safe_update   — OpenSpec has completions tracker doesn't know about; applies them
    conflict      — tracker has done tasks that OpenSpec still shows pending; repair guidance returned
    manual_follow_up — both safe updates and conflicts present; operator review required
```

### Phase 7 — Progress tracking

**Goal**: understand the current state of the full workflow.

Tool: `progress_snapshot`

```
progress_snapshot
  reads: .vibe/tracker.yaml
  returns: workflow state, feature counts by status, task counts, change request summary
           warnings when blockers or replan_required features exist
```

---

## Rerun and no-op behavior

The plugin is designed so that selected operations are safe to rerun.

| Operation | Rerun behavior |
|-----------|----------------|
| `openspec_generate` | Updates artifact in place; returns `isUpdate: true` |
| `openspec_sync` with no changes | Returns `no_op` outcome; no tracker writes |
| `plan_generate` (same steps) | Overwrites `05-plan.md`; produces same task structure |
| `plan_generate` on `implementation_in_progress` | **Blocked**; returns error message |
| `discovery_capture` / `discovery_update` | Merges new context with existing; idempotent for same input |

When `openspec_sync` returns a `no_op` outcome, no further action is needed. This is the expected result when the tracker and OpenSpec already agree on task state.

---

## Recovery and troubleshooting

### Config is missing or invalid

If `.vibe/config.yaml` is absent and `configErrorSeverity` is `block` (default), all PRD tools will refuse to run and return a config validation error.

**Fix**: create `.vibe/config.yaml` with at minimum an empty models block:

```yaml
models: {}
```

### Review was rejected

When a feature review is rejected:

- feature status → `in_review`
- workflow state → `feature_review`
- existing document artifacts (`01-foundation.md` through `04-technical.md`) are preserved
- only `review.yaml` needs updating with the new review decision

A new review iteration is required before the feature can advance. The review history accumulates across iterations and is visible in `review.yaml`.

### Replan required after a change request

When `change_request_apply` is called for an in-progress feature:

- feature status → `replan_required`
- workflow state → `replan_required`
- foundation and product documents are preserved
- `05-plan.md` must be regenerated after scope changes are applied

To resume: address the change request, regenerate the plan with `plan_generate`, then regenerate the OpenSpec artifact with `openspec_generate`.

### OpenSpec sync returns a conflict

A **conflict** means the tracker has tasks marked done that the OpenSpec artifact still shows as pending. The tracker wins — no tracker state is changed.

The sync output includes repair guidance:

```
Sync result for feat-billing [conflict]:
  Conflicts (tracker authoritative — 1 task(s) need manual OpenSpec update):
    BILL-1: tracker=done, openspec=pending

  Repair guidance:
  1 task(s) are marked done in the tracker but still pending in the OpenSpec artifact.
  To reconcile, open openspec/changes/feat-billing.md and mark the following task(s) as done:
    - [ ] → [x]  BILL-1
  Then rerun openspec_sync to confirm alignment.
```

### OpenSpec sync returns manual_follow_up

A **manual\_follow\_up** outcome means both safe updates and conflicts exist in the same sync pass. Apply the safe updates first, then resolve the conflicts manually before rerunning sync.

### Workflow state seems stuck

Run `progress_snapshot` to see the current workflow state, feature statuses, task counts, and any active change requests. The snapshot output includes warnings when blockers or replan-required features are present.

---

## Example: billing workspace

This scenario matches the validated dogfooding baseline.

### 1. Capture discovery context

```
discovery_capture
  goal: "Create a billing workspace that helps finance teams manage invoice intake and reconciliation."
  actors: ["Finance manager", "Billing operator"]
  constraints: ["Must preserve audit history"]
  successMeasures: ["Invoice intake tasks are assigned consistently"]
```

### 2. Draft and submit the master PRD

```
master_prd_draft
  # returns authoring prompt — draft docs/master-prd.md using preferred model

master_prd_draft
  content: "<your drafted PRD content>"
  # writes docs/master-prd.md, advances to master_prd_drafting

master_prd_submit
  # advances to master_prd_review
```

### 3. Review and approve the PRD

```
master_prd_review
  approved: true
  summary: "Master PRD approved for feature decomposition."
  # advances to feature_splitting
```

### 4. Generate and confirm feature candidates

```
feature_candidates_generate
  candidates:
    - title: "Invoice Intake"
      priority: high
      dependsOn: []
    - title: "Payment Reconciliation"
      priority: medium
      dependsOn: ["invoice-intake"]

feature_candidates_materialize
  confirmedSlugs: ["invoice-intake", "payment-reconciliation"]
  # creates docs/features/feat-invoice-intake/
  #         docs/features/feat-payment-reconciliation/
```

### 5. Review features and generate plans

```
feature_review
  featureId: "feat-invoice-intake"
  approved: true

plan_generate
  featureId: "feat-invoice-intake"
  steps:
    - "Create invoice intake queue"
    - "Add operator assignment workflow"
  # writes docs/features/feat-invoice-intake/05-plan.md
```

### 6. Generate OpenSpec and sync

```
openspec_generate
  featureId: "feat-invoice-intake"
  # writes openspec/changes/feat-invoice-intake.md

openspec_sync
  featureId: "feat-invoice-intake"
  taskDoneIds: ["INVOICE-INTAKE-1"]
  # applies done status from OpenSpec to tracker
```

### 7. Check progress

```
progress_snapshot
  # returns:
  # Workflow: implementation_ready
  # Features — Total: 2, Done: 1, Pending: 1
  # Tasks — Total: 3, Done: 2, Pending: 1
```

---

## Multi-feature scenario

When multiple features are in progress simultaneously:

- each feature has its own review record, plan, and OpenSpec artifact
- `syncOpenSpecStatus` marks a feature `done` only when all its tasks are complete
- the workflow advances to `completed` only when **all** features are done
- `progress_snapshot` shows per-feature breakdown and highlights any blocked or replan-required items

---

## Change requests

When a scope change is needed after planning has started:

```
change_request_apply
  title: "Adjust billing scope"
  request: "Need to revise the payment reconciliation boundary."
  impactedFeatures: ["feat-payment-reconciliation"]
  # sets feat-payment-reconciliation → replan_required
  # sets workflow → replan_required
  # preserves feat-invoice-intake state unchanged
```

Resolve the change request, then regenerate the plan for impacted features before continuing.

---

## Running tests

```bash
bun test            # run all tests
bun run check       # lint + typecheck + test
bun run build       # build dist/index.js
```

---

## Project layout

```
src/
  adapters/     OpenSpec artifact generation and task parsing
  agents/       orchestrator and reviewer agent definitions
  hooks/        workflow state validation hook
  prompts/      review rules and prompt templates
  schemas/      Zod schemas for tracker, features, reviews, config
  store/        persistence layer for all .vibe/* files
  templates/    document templates for feature directories and master PRD
  tools/        OpenCode tool definitions (one file per tool)
  utils/        constants, fs helpers, path utilities
  workflows/    core orchestration logic (authoring, decomposition, review, recovery, progress)
tests/
  store/        persistence store tests
  workflows/    workflow logic tests including full dogfooding scenario
openspec/
  changes/      OpenSpec change artifacts for this plugin's own development
```
