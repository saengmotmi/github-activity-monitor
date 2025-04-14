import { ActivityItem } from "../../../models/activity";

export interface IMessageFormatter<MessagePayload = unknown> {
  formatSingleItem(item: ActivityItem): MessagePayload | null;
}
