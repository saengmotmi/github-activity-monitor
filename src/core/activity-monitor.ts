import { AppConfig } from "../configs/app-config";
import { IActivityFetcher } from "../modules/activity-fetching/activity-fetcher";
import { INotifier } from "../modules/notification/notifier";
import { IStateManager } from "../modules/state-management/state-manager";
import { IActivityProcessor } from "./activity-processor";
import { IStateProcessor } from "./state-processor";

interface ActivityMonitorDependencies {
  fetcher: IActivityFetcher;
  stateManager: IStateManager;
  activityProcessor: IActivityProcessor;
  stateProcessor: IStateProcessor;
  notifier: INotifier;
  config: AppConfig;
}

export class ActivityMonitor {
  public constructor(private readonly dependencies: ActivityMonitorDependencies) {}

  public async run(): Promise<void> {
    console.log("ActivityMonitor run starting...");
    const { stateManager, fetcher, activityProcessor, stateProcessor, notifier, config } =
      this.dependencies;

    try {
      const currentState = stateManager.loadState();
      const fetchedActivities = await fetcher.fetchNewActivities(currentState);

      if (fetchedActivities.length === 0) {
        console.log("No new activities found. Monitoring run finished.");
        return;
      }

      console.log(`Found ${fetchedActivities.length} new activities.`);

      const itemsToNotify = await activityProcessor.processForNotification(fetchedActivities);
      console.log(`Prepared ${itemsToNotify.length} items for notification.`);

      await notifier.sendNotification(
        itemsToNotify,
        fetchedActivities.length,
        config.maxItemsPerRun
      );

      const nextState = stateProcessor.calculateNextState(currentState, fetchedActivities);
      stateManager.saveState(nextState);

      console.log("ActivityMonitor run finished successfully.");
    } catch (error) {
      console.error("Error during ActivityMonitor run:", error);
    }
  }
}
