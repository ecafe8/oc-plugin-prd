import { z } from "zod";

import { configSeveritySchema } from "@/schemas/workflow";

const modelRoleConfigSchema = z.object({
  model: z.string().min(1),
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
    })
    .default(() => ({
      autoSyncOpenSpec: true,
      configErrorSeverity: "block",
    })),
});

export type VibeConfig = z.infer<typeof vibeConfigSchema>;
