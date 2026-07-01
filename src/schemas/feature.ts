import { z } from "zod";

import { documentApplicabilitySchema, featureStatusSchema, taskStatusSchema } from "@/schemas/workflow";

const defaultFeatureDocs = {
  index: "required",
  foundation: "required",
  product: "required",
  uiUx: "optional",
  technical: "required",
  plan: "required",
} as const;

export const featureManifestSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  sequence: z.number().int().positive(),
  title: z.string().min(1),
  status: featureStatusSchema,
  docs: z
    .object({
      index: documentApplicabilitySchema.default("required"),
      foundation: documentApplicabilitySchema.default("required"),
      product: documentApplicabilitySchema.default("required"),
      uiUx: documentApplicabilitySchema.default("optional"),
      technical: documentApplicabilitySchema.default("required"),
      plan: documentApplicabilitySchema.default("required"),
    })
    .default(defaultFeatureDocs),
  dependencies: z.array(z.string()).default([]),
  blockers: z.array(z.string()).default([]),
});

export const taskRecordSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  status: taskStatusSchema,
  dependsOn: z.array(z.string()).default([]),
  targets: z.array(z.string()).default([]),
  verification: z.array(z.string()).default([]),
});

export type FeatureManifest = z.infer<typeof featureManifestSchema>;
export type TaskRecord = z.infer<typeof taskRecordSchema>;
