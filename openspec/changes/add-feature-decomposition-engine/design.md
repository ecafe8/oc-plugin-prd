## Context

After `add-prd-authoring-orchestration`, the harness will be able to produce a stable master PRD from discovery context. The next step is to convert that project-level document into a manageable set of feature-level PRD directories with deterministic naming and clear scope boundaries.

The decomposition engine should not yet perform review-loop execution. Its job is to generate high-quality feature candidates and scaffold their small-file matrices so later stages can review them.

## Goals / Non-Goals

**Goals:**

- Extract feature candidates from the approved master PRD.
- Assign deterministic `feat-<slug>` names and avoid duplicates.
- Generate feature manifests and the canonical document matrix for each feature.
- Infer dependencies and ordering hints between features.
- Record why each feature exists and which master PRD concerns it covers.

**Non-Goals:**

- Feature review-loop execution.
- Plan generation for implementation tasks.
- OpenSpec handoff.

## Decisions

### 1. Feature decomposition operates on approved master PRD input only

The decomposition engine SHALL only run when the master PRD has passed review or is otherwise explicitly approved.

Rationale:

- prevents feature churn caused by unstable project intent

### 2. The engine produces feature candidates before materialization

The decomposition flow SHALL have two stages:

1. candidate generation
2. feature matrix materialization

Candidate fields SHOULD include:

- `title`
- `slug`
- `summary`
- `priority`
- `sourceSections`
- `dependsOn`
- `rationale`

Rationale:

- allows later review or user confirmation before the filesystem is updated

### 3. Dependency inference is best-effort but must be explicit

The engine SHALL persist inferred dependencies even when confidence is partial.

Rules:

- direct prerequisites SHOULD be captured in the feature manifest
- uncertain dependencies MAY be recorded as blockers or notes rather than hard dependencies
- shared foundational work SHOULD be represented consistently across affected features

Rationale:

- later review and planning need explicit signals, even if some are provisional

### 4. Materialized features must include traceability back to the master PRD

Each feature SHALL record which part of the master PRD it came from.

Recommended locations:

- `index.md` summary section
- feature manifest metadata

Rationale:

- prevents orphaned features and supports change-request impact analysis later

## Risks / Trade-offs

- [Over-splitting] -> The engine may generate too many tiny features. Mitigation: use candidate review and prioritization signals before materialization.
- [Under-splitting] -> Large features may remain too broad for downstream planning. Mitigation: require summary and scope size heuristics during candidate generation.
- [Dependency guesswork] -> Inferred dependencies may be imperfect. Mitigation: store them explicitly and allow later review to revise them.
