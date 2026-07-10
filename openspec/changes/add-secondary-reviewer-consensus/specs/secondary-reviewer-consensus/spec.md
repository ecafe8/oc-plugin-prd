## ADDED Requirements

### Requirement: Secondary review SHALL be optional and policy-driven
The harness SHALL invoke a secondary reviewer only when the configured policy and trigger conditions require it.

#### Scenario: Secondary review is disabled
- **WHEN** the secondary reviewer policy is `never` or no secondary model is configured
- **THEN** the primary review loop SHALL proceed without invoking a second reviewer

#### Scenario: Disagreement triggers secondary review
- **WHEN** the policy is `on_disagreement` and the primary review produces a disagreement trigger
- **THEN** the harness SHALL run one bounded independent secondary critique

### Requirement: Secondary reviewers SHALL critique independently
The secondary reviewer SHALL receive the artifact and review context without being shown the primary reviewer's critique before producing its own result.

#### Scenario: Independent critiques are collected
- **WHEN** secondary review is triggered
- **THEN** the review record SHALL preserve primary and secondary critique outputs separately before synthesis
