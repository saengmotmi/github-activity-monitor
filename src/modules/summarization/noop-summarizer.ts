// src/adapters/llm/noop-summarizer.ts
import { IActivitySummarizer } from "../../core/interfaces";
import { ActivityItem } from "../../models/activity";

export class NoopSummarizer implements IActivitySummarizer {
  constructor() {
    console.log("NoopSummarizer initialized (summarization disabled).");
  }
  async summarizeActivities(activities: ActivityItem[]): Promise<ActivityItem[]> {
    console.log("Skipping summarization (NoopSummarizer).");
    return activities;
  }
}
