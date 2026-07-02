import { tool } from "@opencode-ai/plugin";

import { loadMergedConfig, writeWorkspaceConfig } from "@/store/config";
import type { ModelRole } from "@/utils/constants";

export const switchModelTool = tool({
  description:
    "Switch the model used for a specific role (drafting or review). Updates .vibe/config.yaml. Takes effect immediately for subsequent tool calls.",
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

    return {
      title: "Model switched",
      output: `${role}: ${previousModel} → ${args.model}\nThe change takes effect immediately for subsequent tool calls.`,
      metadata: {
        role,
        previousModel,
        newModel: args.model,
      },
    };
  },
});
