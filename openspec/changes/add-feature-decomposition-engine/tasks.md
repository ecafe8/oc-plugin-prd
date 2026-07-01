## 1. Add feature candidate modeling

- [ ] 1.1 Define schemas and stores for feature candidates, priorities, source references, and dependency hints
- [ ] 1.2 Add workflow helpers that derive candidate features from the approved master PRD and discovery context
- [ ] 1.3 Add deterministic slugging and duplicate-candidate resolution rules
- [ ] 1.4 Add a candidate confirmation gate that presents candidates to the user and awaits acceptance before materialization

## 2. Add feature matrix materialization

- [ ] 2.1 Add feature materialization workflows that create manifests and canonical `feat-<slug>` document matrices from confirmed candidates
- [ ] 2.2 Extend `index.md` and manifest generation with source traceability and rationale metadata
- [ ] 2.3 Persist dependency and blocker data in materialized feature metadata
- [ ] 2.4 Update tracker workflow state to `feature_splitting` when materialization begins

## 3. Validate decomposition behavior

- [ ] 3.1 Add tests for candidate generation shape, collision handling, and deterministic ordering
- [ ] 3.2 Add tests for blocking decomposition when master PRD is not approved
- [ ] 3.3 Add tests for the candidate confirmation gate and selective materialization
- [ ] 3.4 Add tests for feature matrix generation and source traceability persistence
- [ ] 3.5 Add tests for hard dependency and soft dependency recording
