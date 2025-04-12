import { ActivityItem } from "../../models/activity";

/** Sends notifications to a specific platform */
export interface INotifier {
  sendNotification(
    itemsToSend: ActivityItem[],
    totalNewCount: number,
    maxItems: number
  ): Promise<void>;
}
