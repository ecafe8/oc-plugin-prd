import { tool } from "@opencode-ai/plugin";

import { readTracker } from "@/store";
import { summarizeTracker } from "@/workflows";

export const progressSnapshotTool = tool({
  description: "Summarize current harness workflow and progress state.",
  args: {},
  async execute(_args, context) {
    const tracker = await readTracker(context.directory);

    return {
      title: "Harness progress snapshot",
      output: summarizeTracker(tracker),
    };
  },
});
