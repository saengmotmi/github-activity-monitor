import { LLMProviderType, NotifierProviderType } from "./config";

export const LLM_PROVIDERS = {
  OPENAI: "openai",
  GEMINI: "gemini",
  CLAUDE: "claude",
  NONE: "none",
} as const satisfies Record<string, LLMProviderType>;

export const LLM_DEFAULT_MODELS = {
  [LLM_PROVIDERS.OPENAI]: "gpt-4o-mini",
  [LLM_PROVIDERS.GEMINI]: "gemini-1.5-flash-latest",
  [LLM_PROVIDERS.CLAUDE]: "claude-3-5-sonnet-20240620",
  [LLM_PROVIDERS.NONE]: "",
} as const satisfies Record<LLMProviderType, string>;

export const NOTIFIER_PROVIDERS = {
  DISCORD: "discord",
  SLACK: "slack",
} as const satisfies Record<string, NotifierProviderType>;

export const DEFAULT_STATE_FILE_PATH = "state.json";
export const DEFAULT_MAX_ITEMS_PER_RUN = 5;
export const DEFAULT_SUMMARIZATION_ENABLED = false;
export const DEFAULT_LLM_PROVIDER = LLM_PROVIDERS.NONE;
export const DEFAULT_LLM_MODEL_NAME = "";
