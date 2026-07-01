import type { VibeConfig } from "@/schemas/config";
import type { ModelRole } from "@/utils/constants";

export function resolveModelForRole(config: VibeConfig, role: ModelRole, fallbackModel?: string): string | undefined {
  const configured = config.models[role];
  return configured?.model ?? fallbackModel;
}
