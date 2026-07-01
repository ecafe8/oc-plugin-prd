## 1. Establish plugin architecture and workflow modules

- [x] 1.1 Create the `src/` module layout for `workflows`, `agents`, `tools`, `hooks`, `store`, `schemas`, `prompts`, `templates`, `adapters`, and `utils`
- [x] 1.2 Replace the placeholder plugin entrypoint with an OpenCode plugin assembly that can register PRD harness tools and state-aware hooks
- [x] 1.3 Add typed workflow-state constants and shared lifecycle helpers for Discover -> Track transitions
- [x] 1.4 Add configuration loading and validation boundaries for workspace and user-level PRD harness settings

## 2. Implement harness state and persistence

- [x] 2.1 Define runtime schemas for `.vibe/tracker.yaml`, feature manifests, `review.yaml`, and session state
- [x] 2.2 Implement store modules for reading and writing tracker, review, session, and change-request records
- [x] 2.3 Implement workflow-state transition guards, including review blocking and `replan_required` handling
- [x] 2.4 Define and validate role-based model configuration for `drafting` and `review`, including workspace and user-level overrides
- [x] 2.5 Define and validate the `.vibe/config.yaml` schema, including model roles, workflow defaults, and sync-related settings
- [x] 2.6 Define change-request record schemas and deterministic file naming for `request.md`, `impact.md`, and `decision.md`

## 3. Add PRD document templates and generation flow

- [x] 3.1 Create templates for `docs/master-prd.md` and canonical feature files (`index`, `foundation`, `product`, `ui-ux`, `technical`, `plan`)
- [x] 3.2 Implement discovery and master-PRD workflow steps that create or revise `docs/master-prd.md`
- [x] 3.3 Implement feature-splitting workflow steps that scaffold `docs/features/feat-<slug>/` with the canonical document set and manifest metadata
- [x] 3.4 Implement deterministic feature naming, collision handling, and `index.md` summary generation

## 4. Add review-gated planning

- [x] 4.1 Define global PRD quality checks and document-specific review checks as separate rule assets
- [x] 4.2 Implement master-PRD and feature-PRD review workflows that persist structured results to `review.yaml`
- [x] 4.3 Implement model selection logic so PRD drafting and PRD review can use different configured models with safe fallback behavior
- [x] 4.4 Implement plan-generation workflows that are allowed only after the corresponding review records are approved
- [x] 4.5 Implement revision-loop behavior so rejected artifacts must re-enter review after edits before workflow advancement

## 5. Integrate implementation handoff and progress tracking

- [x] 5.1 Implement aggregate progress tracking in `.vibe/tracker.yaml` for project, feature, and task status
- [x] 5.2 Define the mapping from reviewed `05-plan.md` tasks into OpenSpec implementation artifacts, including affected areas and task derivation rules
- [x] 5.3 Add adapters and workflow steps that create or synchronize OpenSpec implementation artifacts for `implementation_ready` features
- [x] 5.4 Implement sync triggers and reconciliation behavior between OpenSpec task updates and `.vibe/tracker.yaml`
- [x] 5.5 Implement change-request handling that records request, impact, and decision files and syncs replanning status across tracker and OpenSpec context

## 6. Verify the workflow contract

- [x] 6.1 Add tests for tracker persistence, workflow transitions, and review-gate blocking behavior
- [x] 6.2 Add tests for feature directory scaffolding and template applicability handling
- [x] 6.3 Add tests for role-based model resolution, override precedence, and fallback behavior
- [x] 6.4 Add tests for progress synchronization and change-request-driven replanning flows
- [x] 6.5 Add workflow-level integration tests that drive a project from `project_discovery` through `implementation_in_progress` and through a `replan_required` recovery path
