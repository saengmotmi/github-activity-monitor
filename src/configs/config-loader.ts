import dotenv from "dotenv";
import { LLMProviderType } from "../models/config";
import {
  DEFAULT_LLM_MODEL_NAME,
  DEFAULT_LLM_PROVIDER,
  DEFAULT_MAX_ITEMS_PER_RUN,
  DEFAULT_STATE_FILE_PATH,
  DEFAULT_SUMMARIZATION_ENABLED,
  LLM_PROVIDERS,
} from "../models/constant";
import { config as MonitorConfig } from "../../monitor.config";
import { AppConfig, AppSecrets, AppVariables } from "./app-config";

type LLMProviderValidation = {
  [key in LLMProviderType]?: {
    isValid: (config: AppConfig) => boolean;
    errorMessage: string;
  };
};

dotenv.config(); // Load .env for local development

export function loadAndValidateConfig(): AppConfig {
  console.log("Loading and validating application configuration...");

  const secrets = getSecretsFromEnv();
  const variables = getVariablesFromMonitorConfig();

  const appConfig = { ...secrets, ...variables };

  validateAppConfig(appConfig);

  logAppConfig(appConfig);

  console.log("Configuration loading process complete.");

  return appConfig;
}

function getSecretsFromEnv(): AppSecrets {
  console.log("Assembling configuration from environment variables...");
  return {
    githubPat: process.env.MONITOR_GITHUB_PAT || "",
    openaiApiKey: process.env.OPENAI_API_KEY,
    geminiApiKey: process.env.GOOGLE_API_KEY,
    claudeApiKey: process.env.CLAUDE_API_KEY,
    discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
    slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
  };
}

function getVariablesFromMonitorConfig(): AppVariables {
  return {
    repoConfigs: MonitorConfig.repoConfigs ?? [],
    stateFilePath: MonitorConfig.stateFilePath ?? DEFAULT_STATE_FILE_PATH,
    maxItemsPerRun: MonitorConfig.maxItemsPerRun ?? DEFAULT_MAX_ITEMS_PER_RUN,
    summarizationEnabled: MonitorConfig.summarizationEnabled ?? DEFAULT_SUMMARIZATION_ENABLED,
    llmProvider: MonitorConfig.llmProvider ?? DEFAULT_LLM_PROVIDER,
    llmModelName: MonitorConfig.llmModelName ?? DEFAULT_LLM_MODEL_NAME,
  };
}

function validateAppConfig(config: AppConfig): void {
  console.log("Validating configuration...");

  if (config.githubPat === "") throw new Error("Missing required config: MONITOR_GITHUB_PAT (Secret)");

  if (config.repoConfigs.length === 0)
    throw new Error("Missing or invalid required config: RepoConfigs");

  if (config.repoConfigs.some((rc) => rc.name === ""))
    throw new Error("Missing or invalid required config: RepoConfigs.name");

  if (config.repoConfigs.some((rc) => rc.monitorTypes.length === 0))
    throw new Error("Missing or invalid required config: RepoConfigs.monitorTypes");

  if (!config.discordWebhookUrl && !config.slackWebhookUrl) {
    console.warn(
      "Warning: No notifier webhook URL configured (DISCORD_WEBHOOK_URL or SLACK_WEBHOOK_URL). Notifications may fail."
    );
    throw new Error("At least one notifier webhook URL is required.");
  }

  const llmProviderValidation: LLMProviderValidation = {
    [LLM_PROVIDERS.OPENAI]: {
      isValid: (cfg) => !!cfg.openaiApiKey,
      errorMessage: "OpenAI summarization requires OPENAI_API_KEY (Secret)",
    },
    [LLM_PROVIDERS.GEMINI]: {
      isValid: (cfg) => !!cfg.geminiApiKey,
      errorMessage: "Gemini summarization requires GOOGLE_API_KEY (Secret)",
    },
    [LLM_PROVIDERS.CLAUDE]: {
      isValid: (cfg) => !!cfg.claudeApiKey,
      errorMessage: "Claude summarization requires CLAUDE_API_KEY (Secret)",
    },
  };

  if (config.summarizationEnabled) {
    if (config.llmProvider === LLM_PROVIDERS.NONE) {
      console.warn(
        `Summarization is enabled but LLM_PROVIDER is '${LLM_PROVIDERS.NONE}'. Disabling summarization.`
      );
      config.summarizationEnabled = false;
    } else {
      if (!config.llmModelName) {
        console.warn(
          `LLM model name could not be determined for provider: ${config.llmProvider}. Using default or summarization might fail.`
        );
      }

      const validator = llmProviderValidation[config.llmProvider];
      if (validator && !validator.isValid(config)) {
        throw new Error(validator.errorMessage);
      }
    }
  }
}

function logAppConfig(config: AppConfig): void {
  // repo - [monitor type]
  console.log(
    `--- Monitoring Repos --- \n${config.repoConfigs
      .map((rc) => `repo: ${rc.name} - types: ${rc.monitorTypes.join(", ")}`)
      .join("\n")}`
  );

  console.log(`State File Path: ${config.stateFilePath}`);

  if (config.summarizationEnabled) {
    console.log(
      `Summarization Enabled: ${config.summarizationEnabled}, Provider: ${config.llmProvider} - ${config.llmModelName}`
    );
  }
}
