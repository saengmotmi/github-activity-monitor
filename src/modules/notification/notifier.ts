import { ActivityItem } from "../../models/activity";

/** Sends notifications to a specific platform */
export interface INotifier {
  sendNotification(itemsToSend: ActivityItem[]): Promise<void>;
}
