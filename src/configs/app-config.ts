import { LLMProviderType, RepoConfig } from "../models/config";

export type AppSecrets = {
  /** GitHub Personal Access Token */
  githubPat: string;
  /** OpenAI API Key */
  openaiApiKey?: string;
  /** Gemini API Key */
  geminiApiKey?: string;
  /** Claude API Key */
  claudeApiKey?: string;
  /** Discord Webhook URL */
  discordWebhookUrl?: string;
  /** Slack Webhook URL */
  slackWebhookUrl?: string;
};

export type AppVariables = {
  /** Repository Configurations @see RepoConfig */
  repoConfigs: RepoConfig[];
  /** State File Path @default "state.json" */
  stateFilePath: string;
  /** Maximum Items Per Run @default 5 */
  maxItemsPerRun: number;
  /** Summarization Enabled @default true */
  summarizationEnabled: boolean;
  /** LLM Provider, if none, summarization will be disabled @see LLMProviderType @default "none" */
  llmProvider: LLMProviderType;
  /** LLM Model Name */
  llmModelName?: string;
};

export type AppConfig = AppSecrets & AppVariables;
