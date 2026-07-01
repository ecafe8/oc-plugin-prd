import { z } from "zod";

import { changeRequestRecordSchema } from "@/schemas/change-request";
import { featureManifestSchema, taskRecordSchema } from "@/schemas/feature";
import { workflowStateSchema } from "@/schemas/workflow";

export const trackerFeatureSchema = featureManifestSchema.extend({
  reviewPath: z.string().default(""),
  tasks: z.array(taskRecordSchema).default([]),
});

export const trackerSchema = z.object({
  workflow: z.object({
    state: workflowStateSchema,
    updatedAt: z.string(),
    activeChangeRequestId: z.string().optional(),
  }),
  project: z.object({
    title: z.string().default(""),
    summary: z.string().default(""),
  }),
  features: z.array(trackerFeatureSchema).default([]),
  changeRequests: z.array(changeRequestRecordSchema).default([]),
});

export const sessionStateSchema = z.object({
  workflowState: workflowStateSchema,
  activeFeatureId: z.string().optional(),
  activeChangeRequestId: z.string().optional(),
  updatedAt: z.string(),
});

export type Tracker = z.infer<typeof trackerSchema>;
export type TrackerFeature = z.infer<typeof trackerFeatureSchema>;
export type SessionState = z.infer<typeof sessionStateSchema>;
