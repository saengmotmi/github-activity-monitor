import { ActivityItem } from "../../models/activity";
import { IHttpClient } from "../http-client/http-client";
import { INotifier } from "./notifier";
import { DiscordMessageFormatter } from "./generate-discord-message";

export class DiscordNotifier implements INotifier {
  private readonly webhookUrl: string;
  private readonly httpClient: IHttpClient;
  private readonly formatter: DiscordMessageFormatter;

  constructor(webhookUrl: string, httpClient: IHttpClient, formatter: DiscordMessageFormatter) {
    if (!webhookUrl) throw new Error("Discord Webhook URL is required.");
    this.webhookUrl = webhookUrl;
    this.httpClient = httpClient;
    this.formatter = formatter;
    console.log("DiscordNotifier initialized.");
  }

  async sendNotification(
    itemsToSend: ActivityItem[],
    totalNewCount: number,
    maxItems: number
  ): Promise<void> {
    const payload = this.formatter.format(itemsToSend, totalNewCount, maxItems);
    if (!payload) {
      console.log("No items formatted for Discord notification.");
      return;
    }

    try {
      await this.httpClient.post(this.webhookUrl, payload, {
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      });

      console.log(`Sent ${itemsToSend.length} activities notification to Discord.`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        const errorDetails = error.message || error;
        console.error("Error sending notification to Discord:", JSON.stringify(errorDetails));
      } else {
        console.error("Error sending notification to Discord:", String(error));
      }
    }
  }
}
