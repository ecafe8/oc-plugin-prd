## Context

This change defines the first full-lifecycle version of `oc-plugin-prd` as a workflow harness rather than a single-purpose PRD generator. The target workflow starts when a user initializes a monorepo and describes the project in natural language, then continues through discussion, master PRD authoring, review and revision loops, feature decomposition, feature review, implementation confirmation, OpenSpec-assisted delivery, and aggregated progress tracking.

The current repository is essentially empty, so this change sets the architectural contract that future implementation should follow. The design should preserve the strengths discussed during exploration:

- small-file PRD decomposition to minimize LLM context pollution
- explicit review gates rather than free-form document generation
- a harness-owned workflow tracker as the overall source of truth
- OpenSpec integration for implementation-phase planning and execution
- a plugin structure inspired by `micode` in code organization, but tailored to PRD lifecycle control instead of generic brainstorm-plan-implement flows

The harness needs to support re-entry when users add or change requirements midstream. That means the workflow cannot be linear-only. It must detect impacted features, mark them for replanning, and preserve historical review and progress state.

## Goals / Non-Goals

**Goals:**

- Define an end-to-end workflow state machine for Discover -> Master PRD -> Review -> Split Features -> Review -> Confirm -> Implement/OpenSpec -> Track.
- Define a durable filesystem layout for runtime state, PRD artifacts, and implementation specs.
- Define required and optional PRD document types for master and feature-level documentation.
- Define review-gate behavior, including global PRD checks and document-specific checks.
- Define separate model roles for PRD authoring and PRD review, plus a user-overridable configuration hierarchy.
- Define tracker, review, and session responsibilities so progress can be resumed safely across long-running work.
- Define the boundary between harness-owned orchestration and OpenSpec-owned implementation artifacts.
- Keep the future implementation modular using a `micode`-style separation of agents, hooks, tools, schemas, templates, adapters, and workflow modules.

**Non-Goals:**

- Implementing the full plugin in this change.
- Designing UI mockups or a browser workflow interface.
- Selecting specific LLM providers, temperatures, or multi-model review policies.
- Replacing OpenSpec as the implementation-spec system.

## Decisions

### 1. The harness uses a workflow state machine as the primary control model

The plugin SHALL manage explicit workflow states instead of deriving progress implicitly from file existence.

Initial state set:

- `project_discovery`
- `master_prd_drafting`
- `master_prd_review`
- `feature_splitting`
- `feature_review`
- `awaiting_user_confirmation`
- `implementation_ready`
- `implementation_in_progress`
- `change_request_received`
- `replan_required`
- `completed`

Rationale:

- users can enter new requirements after implementation has started
- review loops need a first-class place in the lifecycle
- tool and agent behavior should be state-aware instead of always available

Alternative considered: infer workflow state solely from documents and directories. Rejected because review outcomes, approvals, and replanning triggers are not reliably recoverable from static files alone.

### 2. The harness owns overall workflow truth; OpenSpec owns implementation-change truth

The system will maintain three distinct truth layers:

- `docs/`: product and delivery intent
- `.vibe/`: workflow runtime and aggregate progress
- `openspec/`: implementation change artifacts

Rationale:

- OpenSpec is strong at agreed implementation context and task execution, but it should not become the global controller for discovery, PRD quality gates, or total project status
- the harness needs a single place to aggregate cross-feature status and change-request impact

Alternative considered: use OpenSpec as the only tracker. Rejected because it makes early product-discovery and cross-feature orchestration awkward and couples all workflow phases to implementation semantics.

### 3. Feature PRDs use fixed semantic dimensions with controlled optionality

Each feature directory will use this structure:

```text
docs/
  master-prd.md
  features/
    feat-xx/
      index.md
      01-foundation.md
      02-product.md
      03-ui-ux.md
      04-technical.md
      05-plan.md
      review.yaml
```

Semantic rules:

- `index.md`: always required summary and navigation file
- `01-foundation.md`: always required
- `02-product.md`: always required
- `03-ui-ux.md`: optional by applicability, but preferred to exist and declare `not_applicable` when absent from scope
- `04-technical.md`: required before implementation starts
- `05-plan.md`: required before implementation starts
- `review.yaml`: always required once review begins

Rationale:

- the four semantic dimensions discussed by the user are useful and map well to LLM context control
- forcing every feature to answer the same questions through the same files simplifies orchestration
- allowing explicit `not_applicable` avoids fake content while preserving deterministic file expectations

Alternative considered: completely dynamic document sets per feature. Rejected because automation becomes harder and feature directories become inconsistent.

### 4. Master PRD stays concise and avoids implementation detail

`docs/master-prd.md` will serve as the project constitution. It defines project goals, user/problem framing, boundaries, priorities, dependencies, and success measures. It SHALL NOT contain detailed feature-by-feature technical design.

Rationale:

- the master PRD should align subsequent feature decomposition without turning into a giant context dump
- implementation details belong in feature-level technical documents and OpenSpec changes

### 5. Review gates combine global checks and document-specific checks

The harness will separate authoring templates from evaluation rules.

Global blocking checks:

- background is concrete
- goals are measurable
- target users or actors are explicit
- scope and non-goals are explicit
- business rules are actionable
- edge and exception flows are covered
- acceptance criteria are testable
- priorities are explicit
- dependencies and constraints are explicit
- risks are explicit

Document-specific checks:

- `foundation`: terminology, roles, permissions, boundaries, assumptions
- `product`: state transitions, normal flow, exception flow, Given-When-Then coverage
- `ui-ux`: component boundaries, loading/empty/error/success states, feedback expectations
- `technical`: data contracts, API contracts, migration/rollback, observability, test strategy

Review output format will be persisted as structured data rather than prose-only comments.

Example:

```yaml
decision:
  status: changes_requested
quality_gates:
  measurable_goal: pass
  edge_cases_covered: fail
document_checks:
  product: warning
summary: Missing failure handling for asynchronous retry exhaustion.
```

Rationale:

- the harness must make deterministic state transitions based on review output
- structured results support retries, dashboards, and automation

Alternative considered: leave review as agent-only natural language. Rejected because state transitions and resumability become unreliable.

### 6. PRD drafting and PRD review use separate logical model roles

The harness SHALL treat PRD authoring and PRD review as separate logical roles with independent model selection.

Minimum logical roles:

- `drafting`: used for master PRD drafting, feature PRD drafting, and revision proposals
- `review`: used for master PRD review, feature PRD review, and plan review

Recommended behavior:

- the drafting role should optimize for synthesis and structured authoring
- the review role should optimize for critique, consistency checks, and structured pass/fail output
- the harness may allow both roles to point to the same underlying model, but it SHALL keep the role boundary explicit

Configuration hierarchy:

1. OpenCode default model provides the final fallback
2. user-level plugin config provides personal defaults
3. workspace `.vibe/config.yaml` provides project-local overrides
4. future workflow-step overrides may provide the highest-precedence explicit override

Recommended config shape:

```yaml
models:
  drafting:
    model: provider/model
  review:
    model: provider/model
```

Optional user-level config can mirror the same shape in a plugin-specific config file such as `~/.config/opencode/oc-plugin-prd.jsonc`.

Rationale:

- authoring and review have materially different objectives and benefit from different model behavior
- teams need to tune cost, speed, and strictness without editing workflow code
- explicit model-role separation keeps future maker-checker or fallback strategies compatible with the same workflow contract

Alternative considered: use one global model for every workflow step. Rejected because it hides a critical quality-control knob and makes review behavior harder to tune.

### 7. Change requests become first-class workflow events

When users add or modify requirements after draft or implementation stages, the harness will create a change-request record and map impacted features before resuming planning or implementation.

Recommended runtime structure:

```text
.vibe/
  tracker.yaml
  sessions/
  reviews/
  changes/
    change-xx/
      request.md
      impact.md
      decision.md
```

Behavior:

- record the request
- identify affected features
- mark affected items `replan_required`
- regenerate or amend PRD files and plans
- resync implementation state if OpenSpec changes exist

Rationale:

- ad hoc edits to old documents lose causal history and create silent drift

### 8. Plugin implementation should mirror `micode`'s separation of concerns, not its product workflow

Recommended source layout:

```text
src/
  index.ts
  workflows/
  agents/
  tools/
  hooks/
  store/
  schemas/
  prompts/
  templates/
  adapters/
  utils/
```

Responsibilities:

- `index.ts`: OpenCode plugin assembly only
- `workflows/`: stateful lifecycle logic per stage
- `agents/`: role definitions such as drafter, reviewer, planner, progress manager
- `tools/`: callable workflow tools such as `master_prd_generate`, `feature_split`, `progress_snapshot`
- `hooks/`: session loading, tracker sync, state-aware prompt injection, review gate enforcement
- `store/`: typed read/write access for tracker, review, session, manifest files
- `schemas/`: runtime validation for tracker and review data
- `schemas/`: runtime validation for tracker, review, and role-based model configuration
- `prompts/`: stage-specific prompt assets
- `templates/`: master and feature PRD templates
- `adapters/`: LLM, OpenSpec, Git, filesystem integration boundaries

Rationale:

- this reuses the best part of `micode`: the plugin stays composable and testable
- it prevents a single giant orchestrator file from owning every concern

## Risks / Trade-offs

- [Workflow rigidity] -> A strict state machine may feel heavy for tiny projects. Mitigation: allow a reduced path for simple projects while preserving the same tracker model.
- [Document overhead] -> Multiple small files per feature increase artifact count. Mitigation: use `index.md`, manifests, and template generation to keep navigation predictable.
- [Review latency] -> Repeated review loops can slow momentum. Mitigation: use structured rule checks first and reserve multi-model review for higher-risk gates.
- [Model misconfiguration] -> User-provided model settings may reference unavailable or weak models. Mitigation: validate configured roles, surface warnings, and fall back to the OpenCode default model when allowed.
- [Tracker drift] -> Runtime state can drift from docs or OpenSpec tasks. Mitigation: centralize writes through store modules and add sync hooks after relevant operations.
- [OpenSpec boundary confusion] -> Teams may duplicate status across systems. Mitigation: define `.vibe/tracker.yaml` as total workflow truth and `openspec/` as implementation change truth.


## Implementation Layout

```
src/
  index.ts                 # OpenCode plugin 装配层
  workflows/
    discovery.ts
    draft-master-prd.ts
    review-master-prd.ts
    split-features.ts
    review-feature.ts
    create-plan.ts
    sync-openspec.ts
    progress.ts
  agents/
    orchestrator.ts
    prd-drafter.ts
    prd-reviewer.ts
    feature-splitter.ts
    planner.ts
    progress-manager.ts
  tools/
    project_discover.ts
    master_prd_generate.ts
    master_prd_review.ts
    feature_split.ts
    feature_review.ts
    plan_generate.ts
    progress_snapshot.ts
    change_request_apply.ts
  store/
    tracker.ts
    review.ts
    session.ts
    config.ts
  schemas/
    tracker.ts
    review.ts
    manifest.ts
    prd-check.ts
    model-config.ts
  prompts/
    discovery.md
    master-prd.md
    review-master.md
    split-feature.md
    review-feature.md
    plan.md
  templates/
    master-prd.md
    feature/
      index.md
      01-foundation.md
      02-product.md
      03-ui-ux.md
      04-technical.md
      05-plan.md
  adapters/
    llm.ts
    model-selector.ts
    openspec.ts
    git.ts
    filesystem.ts
  hooks/
    workflow-state.ts
    tracker-sync.ts
    review-gate.ts
```
