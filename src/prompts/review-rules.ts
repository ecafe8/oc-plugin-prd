export const globalReviewRules = [
  "background_concrete",
  "goals_measurable",
  "actors_explicit",
  "scope_defined",
  "business_rules_actionable",
  "edge_cases_covered",
  "acceptance_testable",
  "priorities_explicit",
  "dependencies_explicit",
  "risks_explicit",
] as const;

export const documentReviewRules = {
  foundation: ["terminology_consistent", "roles_explicit", "boundaries_explicit"],
  product: ["state_progression_defined", "exception_flow_defined", "acceptance_complete"],
  uiUx: ["component_boundaries_defined", "states_defined", "feedback_defined"],
  technical: ["contracts_defined", "rollback_defined", "observability_defined"],
  plan: ["tasks_ordered", "targets_defined", "verification_defined"],
} as const;
