## 1. Define the canonical dogfooding scenario

- [x] 1.1 Select a realistic project goal for the end-to-end workflow
- [x] 1.2 Define the expected workflow phases to cover
- [x] 1.3 Define the expected tracker states and key output artifacts

## 2. Add happy-path end-to-end validation

- [x] 2.1 Add a full-chain workflow test from goal and discovery through OpenSpec generation
- [x] 2.2 Verify workflow state transitions at each major phase
- [x] 2.3 Verify expected `.vibe/*` artifacts are created and coherent
- [x] 2.4 Verify expected `docs/features/*` artifacts are created and coherent
- [x] 2.5 Verify expected `openspec/changes/*` artifacts are created and coherent

## 3. Add repeatability and no-op validation

- [x] 3.1 Verify OpenSpec generation updates in place when rerun
- [x] 3.2 Verify OpenSpec sync becomes a no-op when tracker and OpenSpec already agree
- [x] 3.3 Verify repeated OpenSpec generation and sync operations do not corrupt workflow state or duplicate artifacts

## 4. Extend beyond the minimal single-feature path

- [x] 4.1 Add coverage for at least one multi-feature or dependency-aware scenario
- [x] 4.2 Verify progress aggregation reflects multiple features correctly
- [x] 4.3 Record rough edges and follow-up hardening needs for the next change

## 5. Confirm the dogfooding baseline

- [x] 5.1 Confirm the canonical scenario is stable and repeatable
- [x] 5.2 Confirm the scenario is suitable as the basis for later documentation
- [x] 5.3 Confirm the change is ready to hand off recovery and idempotence follow-up work
