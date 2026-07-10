import { z } from "zod";

import { reviewStatusSchema } from "@/schemas/workflow";

const checkResultSchema = z.enum(["pass", "warning", "fail", "not_applicable"]);

export const reviewIterationSchema = z.object({
  iteration: z.number().int().positive(),
  status: reviewStatusSchema,
  summary: z.string().default(""),
  blockers: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  timestamp: z.string(),
  reviewModel: z.string().optional(),
});

export const reviewLoopStateSchema = z.object({
  retryCount: z.number().int().min(0).default(0),
  retryThreshold: z.number().int().min(1).default(3),
  maxIterations: z.number().int().min(1).default(3),
  escalationAfter: z.number().int().min(1).default(3),
  escalated: z.boolean().default(false),
  hasContradiction: z.boolean().default(false),
  blockedReason: z.string().optional(),
});

export const reviewRecordSchema = z.object({
  decision: z.object({
    status: reviewStatusSchema,
    updatedAt: z.string(),
  }),
  summary: z.string().default(""),
  qualityGates: z.record(z.string(), checkResultSchema).default({}),
  documentChecks: z.record(z.string(), checkResultSchema).default({}),
  history: z.array(reviewIterationSchema).default([]),
  loopState: reviewLoopStateSchema.default(() => ({
    retryCount: 0,
    retryThreshold: 3,
    maxIterations: 3,
    escalationAfter: 3,
    escalated: false,
    hasContradiction: false,
  })),
});

export type ReviewRecord = z.infer<typeof reviewRecordSchema>;
export type ReviewIteration = z.infer<typeof reviewIterationSchema>;
export type ReviewLoopState = z.infer<typeof reviewLoopStateSchema>;
