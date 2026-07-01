import { z } from "zod";

import {
  CONFIG_ERROR_SEVERITY,
  FEATURE_STATUSES,
  MODEL_ROLES,
  REVIEW_STATUSES,
  TASK_STATUSES,
  WORKFLOW_STATES,
} from "@/utils/constants";

const workflowStateValues = Object.values(WORKFLOW_STATES);
const reviewStatusValues = Object.values(REVIEW_STATUSES);
const taskStatusValues = Object.values(TASK_STATUSES);
const featureStatusValues = Object.values(FEATURE_STATUSES);
const modelRoleValues = Object.values(MODEL_ROLES);
const configSeverityValues = Object.values(CONFIG_ERROR_SEVERITY);

export const workflowStateSchema = z.enum(workflowStateValues as [string, ...string[]]);
export const reviewStatusSchema = z.enum(reviewStatusValues as [string, ...string[]]);
export const taskStatusSchema = z.enum(taskStatusValues as [string, ...string[]]);
export const featureStatusSchema = z.enum(featureStatusValues as [string, ...string[]]);
export const modelRoleSchema = z.enum(modelRoleValues as [string, ...string[]]);
export const configSeveritySchema = z.enum(configSeverityValues as [string, ...string[]]);

export const documentApplicabilitySchema = z.enum(["required", "optional", "not_applicable"]);
