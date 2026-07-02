## Why

The PRD harness plugin now exposes a meaningful workflow surface, but the repository is still missing adoption-quality product documentation. A user can inspect the source code and individual tests, yet still not understand the intended setup, workflow, output structure, or recovery expectations.

Documentation written too early would likely drift as the validated workflow changes. Once end-to-end dogfooding and recovery hardening have stabilized the canonical workflow, the plugin needs a productization pass that turns validated behavior into clear documentation.

A dedicated documentation change is needed so setup, concepts, examples, and troubleshooting can be written against real workflow truth rather than assumptions.

## What Changes

- Replace placeholder repository documentation with product-facing plugin documentation.
- Document installation, runtime assumptions, and configuration.
- Document the canonical workflow from goal capture through OpenSpec synchronization.
- Document artifact structure, repeated execution expectations, and troubleshooting guidance.
- Add validated examples that match the tested workflow baseline.

## Capabilities

### New Capabilities
- `plugin-productization-documentation`: Define adoption-facing documentation for the PRD harness plugin.
- `canonical-workflow-guidance`: Explain the validated end-to-end workflow and how operators should progress through it.
- `workflow-troubleshooting-guidance`: Explain how to interpret common no-op, conflict, rerun, and recovery situations.

### Modified Capabilities
- `project-readme`: Replace the placeholder README with a workflow-accurate product guide.

## Impact

- Makes the plugin understandable without reading source code first.
- Improves adoption readiness for new users and maintainers.
- Reduces support burden caused by ambiguous setup and workflow expectations.
