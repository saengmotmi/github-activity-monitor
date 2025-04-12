import type { ActivitySourceType } from "./activity";

/** LLM Provider Types */
export type LLMProviderType = "openai" | "gemini" | "claude" | "none";

/** Notifier Provider Types */
export type NotifierProviderType = "discord" | "slack";

/** Configuration for monitoring a specific repository */
export type RepoConfig = {
  /** Repository Name @example "owner/repo" */
  name: string;
  /** Activity Source Types to monitor @see ActivitySourceType */
  monitorTypes: ActivitySourceType[];
};
