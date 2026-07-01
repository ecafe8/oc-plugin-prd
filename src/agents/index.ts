export const agents = {
  orchestrator: {
    description: "Coordinates the PRD harness workflow and selects the right tools for the current lifecycle state.",
    mode: "primary",
  },
  reviewer: {
    description: "Evaluates PRD artifacts against structured quality gates.",
    mode: "subagent",
  },
} as const;
