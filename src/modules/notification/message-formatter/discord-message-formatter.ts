import { ActivityItem, hasSummary } from "../../../models/activity";
import { DiscordEmbedTemplate, defaultDiscordEmbedTemplate } from "./discord-embed-template";
import { IMessageFormatter } from "./message-formatter";

export type DiscordPayload = {
  content?: string;
  embeds: {
    title?: string;
    description?: string;
    url?: string;
    color?: number;
    footer?: {
      text: string;
      icon_url?: string;
    };
    timestamp?: string;
  }[];
};

export class DiscordMessageFormatter implements IMessageFormatter<DiscordPayload> {
  private readonly template: DiscordEmbedTemplate;

  public constructor(template: DiscordEmbedTemplate = defaultDiscordEmbedTemplate) {
    this.template = template;
  }

  /**
   * 단일 ActivityItem을 받아 개별 Discord Embed Payload 형식으로 변환합니다.
   * @param item 포맷할 활동 아이템
   * @returns 개별 메시지용 DiscordPayload 객체, 생성할 내용이 없으면 null (거의 발생하지 않음)
   */
  public formatSingleItem(item: ActivityItem): DiscordPayload | null {
    const descriptionParts: string[] = [
      // 1. 제목 (볼드 + 링크)
      `### **[${item.title}](${item.url})**`,
      // 2. 레포지토리 정보
      `Repository: ${item.repo}`,
    ];

    // 3. 요약 정보 (있을 경우)
    if (hasSummary(item)) {
      // 요약 길이 제한 적용
      const summaryPreview =
        item.summary.length > 500 // 개별 메시지이므로 요약 길이를 좀 더 허용
          ? item.summary.substring(0, 497) + "..."
          : item.summary;
      descriptionParts.push(`Summary: ${summaryPreview}`);
    }

    // 최종 description 문자열 생성 (줄바꿈으로 연결)
    const description = descriptionParts.join("\n");

    // description 길이 제한 (4096자) 확인
    const maxDescLength = 4096;
    const truncatedDescription =
      description.length > maxDescLength
        ? description.substring(0, maxDescLength - 3) + "..."
        : description;

    // Embed 객체 생성
    const embed = {
      description: truncatedDescription, // 여기에 주요 정보 통합
      color: this.template.color,
      timestamp: this.template.timestamp_enabled ? item.createdAt : undefined, // 활동 생성 시간 사용 (더 의미 있음)
    };

    return { embeds: [embed] };
  }

  /**
   * IMessageFormatter 인터페이스 구현을 위한 메서드.
   * 이 클래스는 이제 단일 아이템 포맷팅에 초점을 맞추므로,
   * 이 메서드는 내부적으로 formatSingleItem을 사용하거나,
   * Notifier에서 직접 formatSingleItem을 호출하도록 변경할 수 있습니다.
   * 여기서는 Notifier에서 직접 formatSingleItem을 호출한다고 가정하고,
   * 이 메서드는 사용되지 않음을 명시하거나 간단한 구현을 남깁니다.
   */
  public format(
    itemsToSend: ActivityItem[],
    totalNewCount: number, // 이제 사용되지 않음
    maxItems: number // 이제 사용되지 않음
  ): DiscordPayload | null {
    // 이 메서드는 이제 직접 사용되지 않습니다.
    // Notifier에서 formatSingleItem을 각 아이템에 대해 호출해야 합니다.
    console.warn(
      "DiscordMessageFormatter.format() is deprecated. Use formatSingleItem() for each item."
    );
    // 첫 번째 아이템만 포맷하여 반환하거나 null을 반환할 수 있습니다.
    if (itemsToSend.length > 0) {
      return this.formatSingleItem(itemsToSend[0]);
    }
    return null;
  }
}
