## ADDED Requirements

### Requirement: The repository SHALL provide product-facing documentation for the PRD harness plugin
The top-level plugin documentation SHALL explain what the plugin does, how it is configured, and how an operator should use it.

#### Scenario: A new user reads the top-level documentation
- **WHEN** a new operator opens the repository documentation
- **THEN** the documentation SHALL explain plugin purpose, installation assumptions, configuration expectations, and the canonical workflow at a level that does not require reading source code first

### Requirement: Product documentation SHALL replace placeholder project scaffolding text
The repository README SHALL no longer present generic runtime scaffold instructions as the primary explanation of the project.

#### Scenario: README reflects the plugin rather than the runtime scaffold
- **WHEN** the top-level README is reviewed after the documentation change
- **THEN** it SHALL describe the PRD harness plugin workflow and SHALL not remain a Bun-init placeholder document

### Requirement: Documentation SHALL describe model and configuration expectations
The plugin documentation SHALL explain what configuration a user must provide before the workflow can operate, including the model and any runtime settings required by the plugin.

#### Scenario: Operator configures the plugin before first use
- **WHEN** a new operator reads the setup section of the documentation
- **THEN** the documentation SHALL explain the required model configuration, any config file fields that must be set in `.vibe/config.yaml`, and what happens if expected configuration is absent
