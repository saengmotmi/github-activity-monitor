// src/adapters/llm/noop-summarizer.ts

import { ActivityItem } from "../../models/activity";
import { IActivitySummarizer } from "./summarizer";

export class NoopSummarizer implements IActivitySummarizer {
  public async summarizeActivities(activities: ActivityItem[]): Promise<ActivityItem[]> {
    console.log("Skipping summarization (NoopSummarizer).");
    return activities;
  }
}
