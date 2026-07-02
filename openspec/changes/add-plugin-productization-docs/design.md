## Context

The repository currently contains a placeholder README and scattered truth across code, tests, and OpenSpec change artifacts. After phase 2 validation and hardening, the plugin will need a single coherent explanation of:

- what the plugin does
- how to install and configure it
- how to execute the canonical workflow
- what files and directories it creates
- how to interpret rerun, no-op, conflict, and recovery behavior

## Goals / Non-Goals

**Goals:**

- Replace placeholder top-level docs with product-facing documentation.
- Explain the validated canonical workflow clearly.
- Document artifact responsibilities and workflow concepts.
- Document troubleshooting based on actual observed behavior.

**Non-Goals:**

- Writing aspirational docs before workflow behavior is stable.
- Exhaustively documenting every internal helper or source file.
- Adding a graphical UI or tutorial site in this change.
- Freezing future extensibility beyond the validated canonical path.

## Decisions

### 1. Documentation is derived from validated workflow behavior

This change SHALL document the canonical workflow only after end-to-end dogfooding and recovery hardening have stabilized it.

Rationale:

- keeps docs truthful
- avoids churn caused by documenting assumptions

### 2. README should teach the workflow, not only list commands

The top-level documentation SHALL explain the main operator journey from goal capture through OpenSpec synchronization, not merely enumerate tools.

Rationale:

- users need conceptual flow as much as command syntax
- command lists without workflow semantics do not reduce adoption friction

### 3. Troubleshooting must include rerun and conflict behavior

Documentation SHALL explain expected no-op, rerun, conflict, and recovery situations that an operator is likely to encounter.

Rationale:

- real usage includes partial reruns and repair work
- this is a workflow plugin, not a fire-once code generator

### 4. Examples should come from validated scenarios

Documentation examples SHALL be drawn from the canonical dogfooding baseline or recovery-hardened workflow behavior.

Rationale:

- examples should match tested behavior
- avoids stale or fictional sample flows

## Documentation Structure

### Getting started

- plugin purpose and scope
- installation and runtime assumptions
- initial configuration expectations

### Core concepts

- `.vibe/config.yaml`
- `.vibe/tracker.yaml`
- `.vibe/discovery/*`
- `docs/features/*`
- `openspec/changes/*`
- tracker versus OpenSpec responsibilities

### Canonical workflow

- goal and discovery
- PRD authoring
- feature decomposition
- review loop
- implementation planning
- OpenSpec generation and sync
- progress interpretation

### Troubleshooting

- missing config
- review rejection
- repeated execution and no-op
- tracker and OpenSpec disagreement
- replan and recovery

### Examples

- minimal happy path
- multi-feature or dependency-aware path if stable
- recovery-oriented example if validated and maintainable

## Risks / Trade-offs

- [Docs drift from runtime truth] -> Mitigation: derive examples and explanations from validated scenarios.
- [README becomes too dense] -> Mitigation: split deeper reference material into supporting docs if needed.
- [Over-documenting unstable behavior] -> Mitigation: require stable canonical and recovery behavior before finalizing docs.
