import { ActivityItem } from "../../models/activity";
import { IHttpClient } from "../http-client/http-client";
import {
  DiscordMessageFormatter,
  DiscordPayload,
} from "./message-formatter/discord-message-formatter";
import { INotifier } from "./notifier";

export class DiscordNotifier implements INotifier {
  private readonly webhookUrl: string;
  private readonly httpClient: IHttpClient;
  private readonly formatter: DiscordMessageFormatter;

  public constructor(
    webhookUrl: string,
    httpClient: IHttpClient,
    formatter: DiscordMessageFormatter
  ) {
    if (!webhookUrl) throw new Error("Discord Webhook URL is required.");
    this.webhookUrl = webhookUrl;
    this.httpClient = httpClient;
    this.formatter = formatter;
    console.log("DiscordNotifier initialized for sending individual messages.");
  }

  public async sendNotification(itemsToSend: ActivityItem[]): Promise<void> {
    if (itemsToSend.length === 0) {
      console.log("No new activities to notify.");
      return;
    }

    console.log(`Attempting to send ${itemsToSend.length} individual notifications...`);

    for (const item of itemsToSend) {
      const payload: DiscordPayload | null = this.formatter.formatSingleItem(item);

      if (!payload) {
        console.warn(`Failed to format item for Discord notification: ${item.id}`);
        continue;
      }

      try {
        await this.httpClient.post<void>(this.webhookUrl, payload, {
          headers: { "Content-Type": "application/json" },
          timeout: 10000,
        });

        console.log(`Sent notification for activity: ${item.title} (${item.id})`);
      } catch (error: unknown) {
        console.error(`Error sending notification for item ${item.id}:`);
        if (error instanceof Error) {
          const errorDetails = error.message || error;
          console.error(JSON.stringify(errorDetails, null, 2));
        } else {
          console.error(String(error));
        }
      }
    }
    console.log(`Finished sending ${itemsToSend.length} individual notifications.`);
  }
}
