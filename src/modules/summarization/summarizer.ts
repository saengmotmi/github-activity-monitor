import { ActivityItem } from "../../models/activity";

/** Summarizes activity items using an LLM */
export interface IActivitySummarizer {
  summarizeActivities(activities: ActivityItem[]): Promise<ActivityItem[]>;
}
