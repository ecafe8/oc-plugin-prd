## ADDED Requirements

### Requirement: The harness SHALL generate structured OpenSpec implementation artifacts from approved feature plans
The harness SHALL derive implementation-phase OpenSpec artifacts from the reviewed feature plan and associated feature metadata.

#### Scenario: Approved feature plan becomes OpenSpec change input
- **WHEN** a feature reaches `implementation_ready` with an approved `05-plan.md`
- **THEN** the harness SHALL generate or update the corresponding OpenSpec implementation artifacts from that plan

### Requirement: Generated OpenSpec artifacts SHALL preserve feature traceability
The harness SHALL maintain a clear reference between the originating feature and generated OpenSpec implementation artifacts.

#### Scenario: OpenSpec artifacts reference source feature
- **WHEN** the harness generates implementation artifacts for a feature
- **THEN** the generated OpenSpec context SHALL retain the feature identifier, title, and source planning reference

### Requirement: The harness SHALL update rather than duplicate OpenSpec artifacts when they already exist
When a feature already has a corresponding OpenSpec implementation artifact, the harness SHALL update it rather than creating a second conflicting artifact.

#### Scenario: Existing OpenSpec change is updated on re-sync
- **WHEN** the harness is asked to generate or sync OpenSpec artifacts for a feature that already has an associated OpenSpec change
- **THEN** the harness SHALL update the existing artifact rather than creating a new one alongside it
