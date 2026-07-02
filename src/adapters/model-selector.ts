import type { VibeConfig } from "@/schemas/config";
import type { ModelRole } from "@/utils/constants";

export function resolveModelForRole(config: VibeConfig, role: ModelRole, fallbackModel?: string): string | undefined {
  const configured = config.models[role];
  return configured?.model ?? fallbackModel;
}

export interface ResolvedModel {
  model: string | undefined;
  source: "configured" | "fallback" | "opencode-default";
}

export function resolveModelWithSource(config: VibeConfig, role: ModelRole, fallbackModel?: string): ResolvedModel {
  const configured = config.models[role]?.model;
  if (configured) {
    return { model: configured, source: "configured" };
  }
  if (fallbackModel) {
    return { model: fallbackModel, source: "fallback" };
  }
  return { model: undefined, source: "opencode-default" };
}
