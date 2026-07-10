## ADDED Requirements

### Requirement: Reviewer outputs SHALL be synthesized into an explicit consensus status
The harness SHALL classify the relationship between reviewer outputs and produce an explicit synthesis result.

#### Scenario: Reviewers agree on approval
- **WHEN** both reviewers approve and no blocking contradiction exists
- **THEN** the synthesis status SHALL be `agreed_approved`

#### Scenario: Reviewers agree that revision is required
- **WHEN** both reviewers identify blocking revision findings
- **THEN** the synthesis status SHALL be `agreed_revision` and the findings SHALL be merged without duplicates

#### Scenario: Reviewers materially disagree
- **WHEN** one reviewer approves while the other identifies blocking findings, or their blocker sets materially conflict
- **THEN** the synthesis status SHALL be `material_disagreement` and the user-facing result SHALL explain the disagreement

### Requirement: Unresolved disagreement SHALL escalate safely
The harness SHALL not silently select one reviewer outcome when disagreement remains unresolved after the configured consensus budget.

#### Scenario: Consensus budget is exhausted
- **WHEN** material disagreement remains after all configured consensus attempts
- **THEN** the review SHALL enter an escalated or blocked state with both reviewer outputs and a clear human follow-up action
