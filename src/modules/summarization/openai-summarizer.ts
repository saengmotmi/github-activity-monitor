import { ActivityItem } from "../../models/activity";
import { IActivitySummarizer } from "./summarizer";
import OpenAI from "openai";
export class OpenAISummarizer implements IActivitySummarizer {
  private readonly openai: OpenAI;
  private readonly modelName: string;

  constructor(apiKey: string, modelName: string) {
    if (!apiKey) throw new Error("OpenAI API Key is required.");
    this.openai = new OpenAI({ apiKey });
    this.modelName = modelName;
    console.log(`OpenAISummarizer initialized with model: ${modelName}`);
  }

  private async summarizeItem(item: ActivityItem): Promise<string | null> {
    const prompt = `다음 GitHub ${item.sourceType} 내용을 한국어로 한 문장 요약:\n제목: ${item.title}\n내용 일부: ${item.body.substring(0, 500)}...`; // Use sourceType
    try {
      const response = await this.openai.chat.completions.create({
        model: this.modelName,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 100,
        temperature: 0.5,
        n: 1,
      });
      return response.choices[0]?.message?.content?.trim() || null;
    } catch (error: any) {
      console.error(
        `Error summarizing item "${item.title}" with OpenAI:`,
        error.response?.data || error.message || error
      );
      return null;
    }
  }

  async summarizeActivities(activities: ActivityItem[]): Promise<ActivityItem[]> {
    console.log(
      `Attempting to summarize ${activities.length} activities using OpenAI (${this.modelName})...`
    );
    const summaryPromises = activities.map((item) => this.summarizeItem(item));
    const summaries = await Promise.all(summaryPromises);
    return activities.map((item, index) => ({ ...item, summary: summaries[index] }));
  }
}
