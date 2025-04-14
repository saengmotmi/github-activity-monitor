import { KyHttpClient } from "./modules/http-client/ky-http-client";
import { GithubActivityAggregator } from "./modules/activity-fetching/github-activity-aggregator";
import { NodeFileSystem } from "./modules/persistence/node-file-system";
import { JsonStateManager } from "./modules/state-management/json-state-manager";
import { AppConfig } from "./configs/app-config";
import { ActivityMonitor } from "./core/activity-monitor";
import { NoopSummarizer } from "./modules/summarization/noop-summarizer";
import { GithubDiscussionFetcher } from "./modules/activity-fetching/github-discussion-fetcher";
import { DiscordNotifier } from "./modules/notification/discord-notifier";
import { DiscordMessageFormatter } from "./modules/notification/message-formatter/discord-message-formatter";
import { IActivitySummarizer } from "./modules/summarization/summarizer";
import { ActivityProcessor } from "./core/activity-processor";
import { StateProcessor } from "./core/state-processor";
import { GeminiSummarizer } from "./modules/summarization/gemini-summarizer";

function createActivityFetcher(config: AppConfig): GithubActivityAggregator {
  const discussionFetcher = new GithubDiscussionFetcher(config);
  return new GithubActivityAggregator(
    {
      discussionFetcher,
    },
    config.repoConfigs
  );
}

function createStateManager(config: AppConfig): JsonStateManager {
  const fileSystem = new NodeFileSystem();
  return new JsonStateManager(config.stateFilePath, fileSystem);
}

function createNotifier(config: AppConfig): DiscordNotifier {
  const httpClient = new KyHttpClient();

  // TODO: Dynamic Notifier Instance via config
  const discordFormatter = new DiscordMessageFormatter();
  return new DiscordNotifier(config.discordWebhookUrl!, httpClient, discordFormatter);
}

function createSummarizer(config: AppConfig): IActivitySummarizer {
  // TODO: Dynamic Summarizer Instance via config
  return new GeminiSummarizer(config);
}

export function setupApplication(config: AppConfig): ActivityMonitor {
  const stateManager = createStateManager(config);
  const fetcher = createActivityFetcher(config);
  const notifier = createNotifier(config);
  const summarizer = createSummarizer(config);

  const activityProcessor = new ActivityProcessor({
    config,
    summarizer,
  });

  const stateProcessor = new StateProcessor();

  return new ActivityMonitor({
    fetcher,
    stateManager,
    activityProcessor,
    stateProcessor,
    notifier,
  });
}
