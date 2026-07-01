## ADDED Requirements

### Requirement: The harness SHALL preserve structured authoring context across sessions
The harness SHALL persist discovery and authoring metadata needed to resume master PRD drafting without reconstructing context from scratch.

#### Scenario: Authoring session resumes from persisted context
- **WHEN** a user returns to a workspace during discovery or master PRD drafting
- **THEN** the harness SHALL restore the latest structured discovery context, unresolved questions, and relevant master PRD authoring state

### Requirement: Drafting SHALL respect the configured drafting model role
The harness SHALL resolve the drafting model role before executing discovery-to-PRD authoring steps.

#### Scenario: Workspace drafting model is used
- **WHEN** `.vibe/config.yaml` defines a drafting model role
- **THEN** the harness SHALL use that model selection for discovery synthesis and master PRD drafting steps

#### Scenario: Missing drafting model falls back to OpenCode default
- **WHEN** no drafting model is configured in workspace or user config
- **THEN** the harness SHALL fall back to the OpenCode default model and proceed with authoring rather than blocking
