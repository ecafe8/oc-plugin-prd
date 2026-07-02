## 1. Add feature candidate modeling

- [x] 1.1 Define schemas and stores for feature candidates, priorities, source references, and dependency hints
- [x] 1.2 Add workflow helpers that derive candidate features from the approved master PRD and discovery context
- [x] 1.3 Add deterministic slugging and duplicate-candidate resolution rules
- [x] 1.4 Add a candidate confirmation gate that presents candidates to the user and awaits acceptance before materialization

## 2. Add feature matrix materialization

- [x] 2.1 Add feature materialization workflows that create manifests and canonical `feat-<slug>` document matrices from confirmed candidates
- [x] 2.2 Extend `index.md` and manifest generation with source traceability and rationale metadata
- [x] 2.3 Persist dependency and blocker data in materialized feature metadata
- [x] 2.4 Update tracker workflow state to `feature_splitting` when materialization begins

## 3. Validate decomposition behavior

- [x] 3.1 Add tests for candidate generation shape, collision handling, and deterministic ordering
- [x] 3.2 Add tests for blocking decomposition when master PRD is not approved
- [x] 3.3 Add tests for the candidate confirmation gate and selective materialization
- [x] 3.4 Add tests for feature matrix generation and source traceability persistence
- [x] 3.5 Add tests for hard dependency and soft dependency recording
