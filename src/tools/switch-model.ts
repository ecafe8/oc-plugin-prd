import type { PluginInput } from "@opencode-ai/plugin";
import { tool } from "@opencode-ai/plugin";

import { fetchAvailableModelIds } from "@/adapters/model-catalog";
import { loadMergedConfig, writeWorkspaceConfig } from "@/store/config";
import type { ModelRole } from "@/utils/constants";

export function createSwitchModelTool(ctx: PluginInput) {
  return tool({
    description:
      "Switch the model used for a specific role (drafting or review). Updates .vibe/config.yaml. Takes effect immediately for subsequent tool calls. The model ID is validated against OpenCode's currently configured providers (format: provider/model, e.g. github-copilot/claude-sonnet-5) — run `list_models` first if unsure.",
    args: {
      role: tool.schema.enum(["drafting", "review"]),
      model: tool.schema.string().min(1),
    },
    async execute(args, context) {
      const role = args.role as ModelRole;
      const currentConfig = await loadMergedConfig(context.directory);

      const previousModel = currentConfig.models[role]?.model ?? "(default)";

      const updatedConfig = {
        models: {
          ...currentConfig.models,
          [role]: { model: args.model },
        },
        workflow: currentConfig.workflow,
      };

      await writeWorkspaceConfig(context.directory, updatedConfig);

      const catalog = await fetchAvailableModelIds(ctx.client, context.directory);
      let warning = "";
      if (catalog.ok && !catalog.modelIds.includes(args.model)) {
        warning = `\n⚠️  Warning: "${args.model}" was not found among currently available models. Run \`list_models\` to see valid provider/model IDs. The config was still updated — verify this model exists before relying on it.`;
      }

      return {
        title: "Model switched",
        output: `${role}: ${previousModel} → ${args.model}\nThe change takes effect immediately for subsequent tool calls.${warning}`,
        metadata: {
          role,
          previousModel,
          newModel: args.model,
          validated: catalog.ok ? catalog.modelIds.includes(args.model) : null,
        },
      };
    },
  });
}
