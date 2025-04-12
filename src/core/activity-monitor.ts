import { AppConfig } from "../configs/app-config";
import { ActivityItem } from "../models/activity";
import { LastProcessedState } from "../models/state";
import { IActivityFetcher } from "../modules/activity-fetching/activity-fetcher";
import { INotifier } from "../modules/notification/notifier";
import { IStateManager } from "../modules/state-management/state-manager";
import { IActivitySummarizer } from "../modules/summarization/summarizer";

interface ActivityMonitorDependencies {
  fetcher: IActivityFetcher;
  stateManager: IStateManager;
  summarizer: IActivitySummarizer;
  notifier: INotifier;
  config: AppConfig;
}

export class ActivityMonitor {
  constructor(private readonly dependencies: ActivityMonitorDependencies) {}

  public async run(): Promise<void> {
    console.log("ActivityMonitor run starting...");
    try {
      const currentState = this.loadCurrentState();
      const fetchedActivities = await this.fetchNewActivities(currentState);

      if (fetchedActivities.length === 0) {
        console.log("No new activities found. Monitoring run finished.");
        return;
      }

      console.log(`Found ${fetchedActivities.length} new activities.`);

      const itemsToSend = await this.prepareItemsForNotification(fetchedActivities);
      await this.sendNotifications(itemsToSend, fetchedActivities.length);

      this.updateState(currentState, fetchedActivities);

      console.log("ActivityMonitor run finished successfully.");
    } catch (error) {
      console.error("Error during ActivityMonitor run:", error);
    }
  }

  private loadCurrentState(): LastProcessedState {
    return this.dependencies.stateManager.loadState();
  }

  private async fetchNewActivities(currentState: LastProcessedState): Promise<ActivityItem[]> {
    return this.dependencies.fetcher.fetchNewActivities(currentState);
  }

  private async prepareItemsForNotification(
    fetchedActivities: ActivityItem[]
  ): Promise<ActivityItem[]> {
    const itemsToProcess = fetchedActivities.slice(-this.dependencies.config.maxItemsPerRun);

    if (this.dependencies.config.summarizationEnabled) {
      const summarizedItems =
        await this.dependencies.summarizer.summarizeActivities(itemsToProcess);
      return summarizedItems;
    }

    return itemsToProcess;
  }

  private async sendNotifications(
    itemsToSend: ActivityItem[],
    totalFetchedCount: number
  ): Promise<void> {
    await this.dependencies.notifier.sendNotification(
      itemsToSend,
      totalFetchedCount,
      this.dependencies.config.maxItemsPerRun
    );
  }

  private updateState(currentState: LastProcessedState, fetchedActivities: ActivityItem[]): void {
    const nextState = this.dependencies.stateManager.calculateNextState(
      currentState,
      fetchedActivities
    );

    this.dependencies.stateManager.saveState(nextState);
  }
}
