// src/adapters/llm/noop-summarizer.ts

import { ActivityItem } from "../../models/activity";
import { IActivitySummarizer } from "./summarizer";

export class NoopSummarizer implements IActivitySummarizer {
  public async summarizeActivities(activities: ActivityItem[]): Promise<ActivityItem[]> {
    console.log("Skipping summarization (NoopSummarizer).");

    activities.forEach((activity) => {
      activity.summary = `- 요약을 마크다운으로 하면 이렇게 되나? -
        - 1번 활동
        - 2번 활동
        - 3번 활동
      `;
    });

    return activities;
  }
}
