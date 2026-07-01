## 1. Establish plugin architecture and workflow modules

- [ ] 1.1 Create the `src/` module layout for `workflows`, `agents`, `tools`, `hooks`, `store`, `schemas`, `prompts`, `templates`, `adapters`, and `utils`
- [ ] 1.2 Replace the placeholder plugin entrypoint with an OpenCode plugin assembly that can register PRD harness tools and state-aware hooks
- [ ] 1.3 Add typed workflow-state constants and shared lifecycle helpers for Discover -> Track transitions

## 2. Implement harness state and persistence

- [ ] 2.1 Define runtime schemas for `.vibe/tracker.yaml`, feature manifests, `review.yaml`, and session state
- [ ] 2.2 Implement store modules for reading and writing tracker, review, session, and change-request records
- [ ] 2.3 Implement workflow-state transition guards, including review blocking and `replan_required` handling
- [ ] 2.4 Define and validate role-based model configuration for `drafting` and `review`, including workspace and user-level overrides

## 3. Add PRD document templates and generation flow

- [ ] 3.1 Create templates for `docs/master-prd.md` and canonical feature files (`index`, `foundation`, `product`, `ui-ux`, `technical`, `plan`)
- [ ] 3.2 Implement discovery and master-PRD workflow steps that create or revise `docs/master-prd.md`
- [ ] 3.3 Implement feature-splitting workflow steps that scaffold `docs/features/feat-xx/` with the canonical document set and manifest metadata

## 4. Add review-gated planning

- [ ] 4.1 Define global PRD quality checks and document-specific review checks as separate rule assets
- [ ] 4.2 Implement master-PRD and feature-PRD review workflows that persist structured results to `review.yaml`
- [ ] 4.3 Implement model selection logic so PRD drafting and PRD review can use different configured models with safe fallback behavior
- [ ] 4.4 Implement plan-generation workflows that are allowed only after the corresponding review records are approved

## 5. Integrate implementation handoff and progress tracking

- [ ] 5.1 Implement aggregate progress tracking in `.vibe/tracker.yaml` for project, feature, and task status
- [ ] 5.2 Add adapters and workflow steps that create or synchronize OpenSpec implementation artifacts for `implementation_ready` features
- [ ] 5.3 Implement change-request handling that records request, impact, and decision files and syncs replanning status across tracker and OpenSpec context

## 6. Verify the workflow contract

- [ ] 6.1 Add tests for tracker persistence, workflow transitions, and review-gate blocking behavior
- [ ] 6.2 Add tests for feature directory scaffolding and template applicability handling
- [ ] 6.3 Add tests for role-based model resolution, override precedence, and fallback behavior
- [ ] 6.4 Add tests for progress synchronization and change-request-driven replanning flows
