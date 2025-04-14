import { ActivityItem, hasSummary } from "../../../models/activity";
import { DiscordEmbedTemplate } from "./discord-embed-template";
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
  // private readonly template: DiscordEmbedTemplate;

  public formatSingleItem(item: ActivityItem): DiscordPayload | null {
    const descriptionParts: string[] = [
      `### **[${item.title}](${item.url})**`,
      `Repository: ${item.repo}`,
    ];

    // 3. 요약 정보 (있을 경우)
    if (hasSummary(item)) {
      const summaryPreview =
        item.summary.length > 500 ? item.summary.substring(0, 497) + "..." : item.summary;
      descriptionParts.push(`Summary: \n ${summaryPreview}`);
    }

    const description = descriptionParts.join("\n");

    const maxDescLength = 4096;
    const truncatedDescription =
      description.length > maxDescLength
        ? description.substring(0, maxDescLength - 3) + "..."
        : description;

    const embed = {
      description: truncatedDescription,
      color: 0x5865f2,
      timestamp: item.createdAt,
    };

    return { embeds: [embed] };
  }
}
