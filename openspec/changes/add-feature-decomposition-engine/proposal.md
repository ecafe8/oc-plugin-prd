## Why

Once the harness can produce a reviewed master PRD, the next bottleneck is turning that project-level intent into a clear, small-file feature matrix that downstream review and implementation workflows can trust. Manual decomposition is too inconsistent for the harness to remain deterministic, so feature splitting needs its own dedicated engine.

## What Changes

- Add a feature decomposition engine that derives feature candidates from the master PRD and discovery context.
- Add feature-level naming, deduplication, dependency inference, and prioritization rules.
- Add canonical generation of the feature document matrix for each approved feature candidate.
- Add decomposition metadata so later review and planning stages know why a feature exists and what it depends on.

## Capabilities

### New Capabilities
- `feature-candidate-generation`: Derive candidate features from the approved master PRD with normalized names, summaries, and priorities.
- `feature-matrix-generation`: Materialize each accepted feature as the canonical `feat-<slug>` document matrix.
- `feature-dependency-inference`: Infer and persist dependencies, ordering hints, and shared prerequisites across generated features.

### Modified Capabilities

None.

## Impact

- Extends the harness from project-level authoring into automatic feature-level decomposition.
- Adds decomposition metadata and dependency reasoning to tracker state and feature manifests.
- Prepares the input needed for the dedicated review-loop execution change.
