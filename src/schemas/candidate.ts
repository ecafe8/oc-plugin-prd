import { z } from "zod";

export const candidatePrioritySchema = z.enum(["high", "medium", "low"]);

export const featureCandidateSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  summary: z.string().default(""),
  priority: candidatePrioritySchema.default("medium"),
  sourceSections: z.array(z.string()).default([]),
  dependsOn: z.array(z.string()).default([]),
  softDependsOn: z.array(z.string()).default([]),
  rationale: z.string().default(""),
});

export const pendingCandidateSetSchema = z.object({
  generatedAt: z.string(),
  masterPrdApprovedAt: z.string().optional(),
  candidates: z.array(featureCandidateSchema),
});

export type FeatureCandidate = z.infer<typeof featureCandidateSchema>;
export type PendingCandidateSet = z.infer<typeof pendingCandidateSetSchema>;
