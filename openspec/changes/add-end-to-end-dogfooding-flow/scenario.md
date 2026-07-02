## Canonical Scenario

### Project Goal

Build a billing workspace that helps finance teams coordinate invoice intake and payment reconciliation.

### Workflow Phases Covered

1. Discovery context capture and readiness validation
2. Master PRD drafting and submission for review
3. Master PRD approval and feature candidate generation
4. Feature materialization for a multi-feature split
5. Feature review approval and implementation plan generation
6. OpenSpec generation, rerun update-in-place behavior, and sync
7. Multi-feature progress aggregation after one feature completes

### Expected Workflow States

- `project_discovery`
- `master_prd_drafting`
- `master_prd_review`
- `feature_splitting`
- `awaiting_user_confirmation`
- `implementation_ready`

The canonical scenario intentionally stops before the whole project is completed so that the test can verify a partial completion case without incorrectly advancing the full workflow to `completed`.

### Key Artifact Baseline

- `.vibe/discovery/context.yaml`
- `.vibe/discovery/summary.md`
- `.vibe/candidates.yaml`
- `.vibe/reviews/master-prd.yaml`
- `docs/master-prd.md`
- `docs/features/feat-*/index.md`
- `docs/features/feat-*/05-plan.md`
- `openspec/changes/feat-*.md`
