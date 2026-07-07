import type { PluginInput } from "@opencode-ai/plugin";

export interface ModelCatalogResult {
  ok: boolean;
  modelIds: string[];
}

/**
 * Fetches the flattened list of `provider/model` IDs currently available from
 * OpenCode's configured providers. Used to validate model names before they
 * are persisted to `.vibe/config.yaml`.
 */
export async function fetchAvailableModelIds(
  client: PluginInput["client"],
  directory: string,
): Promise<ModelCatalogResult> {
  try {
    const result = await client.config.providers({ query: { directory } });
    if (result.error || !result.data) {
      return { ok: false, modelIds: [] };
    }

    const modelIds = result.data.providers.flatMap((provider) =>
      Object.keys(provider.models).map((modelId) => `${provider.id}/${modelId}`),
    );

    return { ok: true, modelIds };
  } catch {
    return { ok: false, modelIds: [] };
  }
}
