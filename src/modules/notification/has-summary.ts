import { ActivityItem } from "../../models/activity";

/** Type guard to check if an item has a non-null summary */
export function hasSummary(item: ActivityItem): item is ActivityItem & { summary: string } {
  return typeof item.summary === "string" && item.summary.length > 0;
}
