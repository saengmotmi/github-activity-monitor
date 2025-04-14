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

  /**
   * 새로운 활동 아이템 목록을 받아 각 아이템을 개별 Discord 메시지로 전송합니다.
   * @param itemsToSend 전송할 새 활동 아이템 배열
   * @param totalNewCount 전체 새 활동 수 (로깅 외에는 사용되지 않음)
   * @param maxItems 최대 표시 아이템 수 (이제 사용되지 않음)
   */
  public async sendNotification(
    itemsToSend: ActivityItem[],
    totalNewCount: number, // 로깅 등에 활용 가능
    maxItems: number // 이제 사용되지 않음
  ): Promise<void> {
    if (itemsToSend.length === 0) {
      console.log("No new activities to notify.");
      return;
    }

    console.log(`Attempting to send ${itemsToSend.length} individual notifications...`);

    // 각 아이템에 대해 개별 메시지 전송
    for (const item of itemsToSend) {
      // formatter를 사용하여 개별 DiscordPayload 생성
      const payload: DiscordPayload | null = this.formatter.formatSingleItem(item);

      if (!payload) {
        console.warn(`Failed to format item for Discord notification: ${item.id}`);
        continue; // 다음 아이템으로 넘어감
      }

      try {
        await this.httpClient.post<void>(this.webhookUrl, payload, {
          headers: { "Content-Type": "application/json" },
          timeout: 10000,
        });

        console.log(`Sent notification for activity: ${item.title} (${item.id})`);

        // Discord Rate Limit을 피하기 위해 약간의 딜레이 추가 (선택 사항)
        // 활동량이 매우 많을 경우 필요할 수 있습니다. (예: 500ms)
        // await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: unknown) {
        // 개별 에러 처리
        console.error(`Error sending notification for item ${item.id}:`);
        if (error instanceof Error) {
          const errorDetails = error.message || error;
          console.error(JSON.stringify(errorDetails, null, 2));
        } else {
          console.error(String(error));
        }
        // 실패 시 다음 아이템으로 계속 진행
      }
    }
    console.log(`Finished sending ${itemsToSend.length} individual notifications.`);
  }
}
