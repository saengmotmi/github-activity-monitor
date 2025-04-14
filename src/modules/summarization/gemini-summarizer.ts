import { GoogleGenerativeAI } from "@google/generative-ai";
import { AppConfig } from "../../configs/app-config";
import { ActivityItem } from "../../models/activity";
import { IActivitySummarizer } from "./summarizer";
import { GEMINI_SUMMARIZATION_PROMPT } from "./prompt";

export class GeminiSummarizer implements IActivitySummarizer {
  private readonly client: GoogleGenerativeAI;
  private readonly modelName: string;

  public constructor(private readonly config: AppConfig) {
    if (!config.geminiApiKey) {
      throw new Error("Gemini API key is not configured.");
    }
    this.client = new GoogleGenerativeAI(config.geminiApiKey);
    this.modelName = config.llmModelName!;
  }

  public async summarizeActivities(activities: ActivityItem[]): Promise<ActivityItem[]> {
    if (activities.length === 0) {
      console.log("No activities to summarize.");
      return activities;
    }

    const model = this.client.getGenerativeModel({ model: this.modelName });

    const summaryPromises = activities.map(async (activity) => {
      if (activity.body && !activity.summary) {
        const prompt = `${GEMINI_SUMMARIZATION_PROMPT} ${activity.body}`;
        try {
          const result = await model.generateContent(prompt);
          const response = result.response;
          const summaryText = response.text();

          activity.summary = summaryText;
          console.log(`Activity ${activity.id || "No ID"} summarized.`);
        } catch (error) {
          console.error(`Activity ${activity.id || "No ID"} summary generation failed:`, error);
          activity.summary = "Summary generation failed";
        }
      } else if (!activity.body) {
        activity.summary = "No content to summarize";
      }
      return activity;
    });

    const results = await Promise.allSettled(summaryPromises);

    // Collect the results, prioritizing fulfilled promises
    const updatedActivities = results.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        console.error(`Error occurred while summarizing activity (Index ${index}):`, result.reason);
        return activities[index];
      }
    });

    console.log("Finished summarizing activities.");
    return updatedActivities;
  }
}
