import { ActivityItem } from "../../../models/activity";
import { hasSummary } from "../has-summary";
import { DiscordEmbedTemplate, defaultDiscordEmbedTemplate } from "./discord-embed-template";
import { IMessageFormatter } from "./message-formatter";

export type DiscordPayload = {
  embeds: {
    title: string;
    color: number;
    fields: {
      name: string;
      value: string;
      inline: boolean;
    };
  }[];
};

export class DiscordMessageFormatter implements IMessageFormatter<DiscordPayload> {
  private readonly template: DiscordEmbedTemplate;
  private readonly maxFields = 25; // Discord API Embed 필드 최대 개수

  /**
   * 생성자에서 Discord Embed 템플릿 객체를 주입받습니다.
   * 만약 템플릿을 외부에서 주입하지 않고 항상 기본 템플릿을 사용한다면,
   * 생성자 인자를 없애고 내부에서 `this.template = defaultDiscordEmbedTemplate;` 로 설정할 수도 있습니다.
   * 여기서는 유연성을 위해 주입받는 방식을 사용합니다.
   * @param template 사용할 Discord Embed 템플릿 객체
   */
  constructor(template: DiscordEmbedTemplate = defaultDiscordEmbedTemplate) {
    this.template = template;
  }

  /**
   * ActivityItem 배열을 받아 Discord Embed Payload 형식으로 변환합니다.
   * 주입된 템플릿을 사용하여 메시지 구조와 내용을 생성합니다.
   */
  format(
    itemsToSend: ActivityItem[],
    totalNewCount: number,
    maxItems: number
  ): DiscordPayload | null {
    if (itemsToSend.length === 0) return null;

    const actualItems = itemsToSend.slice(0, this.maxFields);
    const isTruncated = itemsToSend.length > this.maxFields;
    const hasMoreItems = totalNewCount > maxItems;

    const embedTitle = this.buildEmbedTitle(actualItems.length);
    const embedFields = this.buildEmbedFields(actualItems);
    const embedFooter = this.buildEmbedFooter(hasMoreItems, isTruncated, totalNewCount, maxItems);

    const embed: DiscordPayload = {
      // 필요시 더 구체적인 타입 사용
      title: embedTitle,
      color: this.template.color,
      fields: embedFields,
    };

    if (embedFooter) {
      embed.footer = embedFooter;
    }

    if (this.template.timestamp_enabled) {
      embed.timestamp = new Date().toISOString();
    }

    // 푸터 내용이 없고 타임스탬프도 비활성화된 경우 footer 객체 제거
    if (!embed.footer?.text && !embed.timestamp) {
      delete embed.footer;
    }

    return { embeds: [embed] };
  }

  /**
   * Embed 제목 문자열을 생성합니다.
   * @param count 표시될 실제 아이템 수
   * @returns 포맷된 제목 문자열
   */
  private buildEmbedTitle(count: number): string {
    return this.template.title.replace("{count}", String(count));
  }

  /**
   * ActivityItem 배열을 Embed Field 배열로 변환합니다.
   * @param items 변환할 ActivityItem 배열 (최대 필드 수 적용 후)
   * @returns EmbedField 객체 배열
   */
  private buildEmbedFields(items: ActivityItem[]) {
    return items.map((item) => {
      const summarySection = hasSummary(item) ? `📝 ${item.summary}\n` : "";
      const fieldName = this.template.fields.name
        .replace("{repo}", item.repo)
        .replace("{title}", item.title);
      const fieldValue = this.template.fields.value
        .replace("{summarySection}", summarySection)
        .replace("{author}", item.author)
        .replace("{sourceType}", item.sourceType);

      return {
        name: fieldName,
        value: fieldValue,
        inline: this.template.fields.inline,
      };
    });
  }

  /**
   * 조건에 따라 Embed Footer 객체를 생성합니다.
   * @param hasMoreItems 전체 아이템 수가 최대 표시 수보다 많은지 여부
   * @param isTruncated 메시지 필드 수가 Discord 제한을 초과하는지 여부
   * @param totalNewCount 필터링 전 전체 새 아이템 수
   * @param maxItems 설정된 최대 표시 아이템 수
   * @returns 생성된 EmbedFooter 객체 또는 내용이 없으면 null
   */
  private buildEmbedFooter(
    hasMoreItems: boolean,
    isTruncated: boolean,
    totalNewCount: number,
    maxItems: number
  ) {
    const footerParts: string[] = [];
    const remainingCount = Math.max(0, totalNewCount - maxItems);

    if (hasMoreItems && remainingCount > 0) {
      footerParts.push(
        this.template.footer_exceeding_items.replace("{remaining_count}", String(remainingCount))
      );
    }
    if (isTruncated) {
      footerParts.push(this.template.footer_truncation);
    }

    const footerText = footerParts.join(" ").trim();

    return footerText ? { text: footerText } : null;
  }
}
