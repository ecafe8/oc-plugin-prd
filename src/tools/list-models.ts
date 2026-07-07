import type { PluginInput } from "@opencode-ai/plugin";
import { tool } from "@opencode-ai/plugin";

export function createListModelsTool(ctx: PluginInput) {
  return tool({
    description:
      "List available models from the currently configured OpenCode providers, so you can verify a model ID before setting it in .vibe/config.yaml or via switch_model. Model IDs must be in `provider/model` format (e.g. `github-copilot/claude-sonnet-5`).",
    args: {
      provider: tool.schema.string().optional(),
    },
    async execute(args) {
      const result = await ctx.client.config.providers({ query: { directory: ctx.directory } });

      if (result.error || !result.data) {
        return {
          title: "Failed to list models",
          output: "Could not retrieve the provider/model list from OpenCode.",
        };
      }

      const { providers, default: defaults } = result.data;
      const filtered = args.provider ? providers.filter((p) => p.id === args.provider) : providers;

      if (filtered.length === 0) {
        return {
          title: "No matching providers",
          output: `No provider found matching "${args.provider}". Available providers: ${providers.map((p) => p.id).join(", ")}`,
        };
      }

      const lines: string[] = [];
      for (const provider of filtered) {
        const modelIds = Object.keys(provider.models);
        const defaultModel = defaults[provider.id];
        lines.push(
          `${provider.id} (${provider.name})${defaultModel ? ` — default: ${provider.id}/${defaultModel}` : ""}`,
        );
        for (const modelId of modelIds) {
          lines.push(`  ${provider.id}/${modelId}`);
        }
      }

      return {
        title: "Available models",
        output: lines.join("\n"),
        metadata: {
          providerCount: filtered.length,
          modelIds: filtered.flatMap((p) => Object.keys(p.models).map((m) => `${p.id}/${m}`)),
        },
      };
    },
  });
}
