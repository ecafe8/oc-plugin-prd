import { z } from "zod";

import { workflowStateSchema } from "@/schemas/workflow";

export const changeRequestRecordSchema = z.object({
  id: z.string().min(1),
  sequence: z.number().int().positive(),
  slug: z.string().min(1),
  title: z.string().min(1),
  createdAt: z.string(),
  impactedFeatures: z.array(z.string()).default([]),
  impactedStates: z.array(workflowStateSchema).default([]),
});

export type ChangeRequestRecord = z.infer<typeof changeRequestRecordSchema>;
