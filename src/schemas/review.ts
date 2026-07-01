import { z } from "zod";

import { reviewStatusSchema } from "@/schemas/workflow";

const checkResultSchema = z.enum(["pass", "warning", "fail", "not_applicable"]);

export const reviewRecordSchema = z.object({
  decision: z.object({
    status: reviewStatusSchema,
    updatedAt: z.string(),
  }),
  summary: z.string().default(""),
  qualityGates: z.record(z.string(), checkResultSchema).default({}),
  documentChecks: z.record(z.string(), checkResultSchema).default({}),
});

export type ReviewRecord = z.infer<typeof reviewRecordSchema>;
