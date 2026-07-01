## Why

The project needs a full-lifecycle AI harness that can guide a monorepo from initial project discovery through PRD authoring, review loops, feature decomposition, implementation handoff, and long-running progress tracking. Existing workflow plugins and spec tools cover pieces of this journey, but there is no single workflow source of truth that keeps product intent, feature-level documents, implementation planning, and execution status aligned as requirements evolve.

## What Changes

- Add a workflow-oriented PRD harness plugin for OpenCode that manages the lifecycle from Discover to Track.
- Define a small-file PRD document system with explicit document roles, required and optional feature artifacts, and durable review records.
- Add review gates for master PRD, feature PRDs, and development plans using shared quality checks plus document-specific checks.
- Add separate model roles for PRD drafting and PRD review, with project-level and user-level configuration overrides.
- Add a persistent tracker model that records workflow state, feature state, task state, approvals, and replanning needs.
- Add OpenSpec handoff and synchronization rules so approved feature work can move into implementation while overall progress remains aggregated at the harness level.

## Capabilities

### New Capabilities
- `project-workflow-orchestration`: Manage the end-to-end harness lifecycle, state transitions, and change-request re-entry points.
- `prd-document-system`: Define master PRD and feature PRD document taxonomy, directory structure, required files, and document responsibilities.
- `review-gated-planning`: Enforce structured PRD self-checks and approval gates before splitting features, planning work, or starting implementation, including separate drafting and review model roles.
- `progress-tracking-openspec-sync`: Track project, feature, and task progress centrally while coordinating implementation-phase artifacts with OpenSpec.

### Modified Capabilities

None.

## Impact

- Adds a new workflow engine and state model under the plugin source tree.
- Introduces project runtime directories such as `.vibe/` plus product documents under `docs/`.
- Defines new schemas for trackers, review results, manifests, workflow state, and role-based model configuration.
- Establishes integration boundaries between harness-owned progress tracking and OpenSpec-owned implementation artifacts.
- Shapes future implementation work across plugin tools, agents, hooks, templates, and adapters.
