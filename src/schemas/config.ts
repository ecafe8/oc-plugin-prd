import { z } from "zod";

import { configSeveritySchema } from "@/schemas/workflow";

const modelRoleConfigSchema = z.object({
  model: z.string().min(1),
});

const reviewWorkflowConfigSchema = z
  .object({
    maxIterations: z.number().int().min(1).default(3),
    escalationAfter: z.number().int().min(1).default(2),
  })
  .superRefine((value, ctx) => {
    if (value.escalationAfter > value.maxIterations) {
      ctx.addIssue({
        code: "custom",
        path: ["escalationAfter"],
        message: "escalationAfter must not exceed maxIterations",
      });
    }
  });

export const vibeConfigSchema = z.object({
  models: z
    .object({
      drafting: modelRoleConfigSchema.optional(),
      review: modelRoleConfigSchema.optional(),
    })
    .default({}),
  workflow: z
    .object({
      autoSyncOpenSpec: z.boolean().default(true),
      configErrorSeverity: configSeveritySchema.default("block"),
      review: reviewWorkflowConfigSchema.default(() => ({
        maxIterations: 3,
        escalationAfter: 2,
      })),
    })
    .default(() => ({
      autoSyncOpenSpec: true,
      configErrorSeverity: "block",
      review: {
        maxIterations: 3,
        escalationAfter: 3,
      },
    })),
});

export type VibeConfig = z.infer<typeof vibeConfigSchema>;
