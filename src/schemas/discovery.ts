import { z } from "zod";

export const discoveryContextSchema = z.object({
  goal: z.string().default(""),
  actors: z.array(z.string()).default([]),
  constraints: z.array(z.string()).default([]),
  assumptions: z.array(z.string()).default([]),
  successMeasures: z.array(z.string()).default([]),
  readyForDrafting: z.boolean().default(false),
  updatedAt: z.string().default(""),
});

export const discoveryAuthoringMetaSchema = z.object({
  discoveryReady: z.boolean().default(false),
  lastDiscoveryUpdate: z.string().optional(),
  lastMasterPrdDraft: z.string().optional(),
  pendingQuestionsCount: z.number().int().min(0).default(0),
});

export type DiscoveryContext = z.infer<typeof discoveryContextSchema>;
export type DiscoveryAuthoringMeta = z.infer<typeof discoveryAuthoringMetaSchema>;
