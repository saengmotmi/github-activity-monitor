import { AppConfig } from "../configs/app-config";
import { ActivityItem } from "../models/activity";
import { IActivitySummarizer } from "../modules/summarization/summarizer";

export interface IActivityProcessor {
  processForNotification(activities: ActivityItem[]): Promise<ActivityItem[]>;
}

interface ActivityProcessorDependencies {
  config: AppConfig;
  summarizer: IActivitySummarizer;
}

export class ActivityProcessor implements IActivityProcessor {
  public constructor(private readonly dependencies: ActivityProcessorDependencies) {}

  public async processForNotification(fetchedActivities: ActivityItem[]): Promise<ActivityItem[]> {
    const { config } = this.dependencies;

    const activitiesByRepo = this.groupActivitiesByRepo(fetchedActivities);

    const filteredActivities = this.filterRecentActivitiesPerRepo(
      activitiesByRepo,
      config.maxItemsPerRun
    );

    const sortedActivities = this.sortActivitiesChronologically(filteredActivities);

    return await this.summarizeIfNeeded(sortedActivities);
  }

  private groupActivitiesByRepo(activities: ActivityItem[]): Record<string, ActivityItem[]> {
    const activitiesByRepo: Record<string, ActivityItem[]> = {};
    for (const activity of activities) {
      if (!activity.repo) continue;
      if (!activitiesByRepo[activity.repo]) {
        activitiesByRepo[activity.repo] = [];
      }
      activitiesByRepo[activity.repo].push(activity);
    }
    return activitiesByRepo;
  }

  private filterRecentActivitiesPerRepo(
    activitiesByRepo: Record<string, ActivityItem[]>,
    maxItemsPerRepo: number
  ): ActivityItem[] {
    const filtered: ActivityItem[] = [];
    for (const repoName in activitiesByRepo) {
      const repoActivities = activitiesByRepo[repoName];

      const sortedRepoActivities = [...repoActivities].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const itemsForThisRepo = sortedRepoActivities.slice(0, maxItemsPerRepo);
      filtered.push(...itemsForThisRepo);
    }
    return filtered;
  }

  private sortActivitiesChronologically(activities: ActivityItem[]): ActivityItem[] {
    return [...activities].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  private async summarizeIfNeeded(activities: ActivityItem[]): Promise<ActivityItem[]> {
    const { config, summarizer } = this.dependencies;
    if (config.summarizationEnabled && activities.length > 0) {
      console.log(`Summarizing ${activities.length} filtered activities...`);
      try {
        return await summarizer.summarizeActivities(activities);
      } catch (error) {
        console.error("Error during summarization:", error);
        return activities;
      }
    }
    return activities;
  }
}
