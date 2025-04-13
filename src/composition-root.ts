import { GithubActivityAggregator } from "./modules/activity-fetching/github-activity-aggregator";
import { NodeFileSystem } from "./modules/persistence/node-file-system";
import { JsonStateManager } from "./modules/state-management/json-state-manager";
import { AppConfig } from "./configs/app-config";
import { ActivityMonitor } from "./core/activity-monitor";
import { NoopSummarizer } from "./modules/summarization/noop-summarizer";
import { GithubDiscussionFetcher } from "./modules/activity-fetching/github-discussion-fetcher";

function createActivityFetcher(config: AppConfig): GithubActivityAggregator {
  const discussionFetcher = new GithubDiscussionFetcher(config);
  return new GithubActivityAggregator(
    {
      discussionFetcher,
    },
    config.repoConfigs
  );
}

export function setupApplication(config: AppConfig): ActivityMonitor {
  const fileSystem = new NodeFileSystem();
  const stateManager = new JsonStateManager(config.stateFilePath, fileSystem);
  const summarizer = new NoopSummarizer();

  const fetcher = createActivityFetcher(config);

  return new ActivityMonitor({
    config,
    fetcher,
    stateManager,
    summarizer,
    notifier: {
      sendNotification: async () => {
        console.log("Notification sent");
      },
    },
  });
}
