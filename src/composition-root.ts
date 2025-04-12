import { AppConfig } from "./configs/app-config";
import { ActivityMonitor } from "./core/activity-monitor";

export function setupApplication(config: AppConfig): ActivityMonitor {
  // mocks
  return new ActivityMonitor({
    config,
    fetcher: {
      fetchNewActivities: async () => [],
    },
    stateManager: {
      loadState: () => ({}),
      calculateNextState: () => ({}),
      saveState: () => {},
    },
    summarizer: {
      summarizeActivities: async () => [],
    },
    notifier: {
      sendNotification: async () => {},
    },
  });
}
