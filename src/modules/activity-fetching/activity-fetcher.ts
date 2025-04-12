import { ActivityItem, ActivitySourceType } from "../../models/activity";
import { LastProcessedState, RepositoryLastProcessed } from "../../models/state";

/** Fetches new activities from the source (GitHub) */
export interface IActivityFetcher {
  fetchNewActivities(currentProcessedState: LastProcessedState): Promise<ActivityItem[]>;
}

/** Fetches a SPECIFIC type of activity for ONE repo */
export interface ISingleSourceActivityFetcher {
  fetchNewActivities(
    repoFullName: string,
    repoLastProcessed: RepositoryLastProcessed
  ): Promise<ActivityItem[]>;
  getSourceType(): ActivitySourceType | ActivitySourceType[];
}
