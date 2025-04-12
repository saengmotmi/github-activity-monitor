import type { AppVariables } from "./configs/app-config";

export const config: AppVariables = {
  repoConfigs: [
    {
      name: "vercel/next.js",
      monitorTypes: ["discussion", "discussion_comment"],
    },
    {
      name: "facebook/react",
      monitorTypes: ["discussion", "discussion_comment"],
    },
  ],

  stateFilePath: "state.json",
  maxItemsPerRun: 5,

  summarizationEnabled: true,
  llmProvider: "gemini",
  llmModelName: "gemini-1.5-flash-latest",
};
