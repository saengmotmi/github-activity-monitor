/**
 * Represents the source type of a GitHub activity.
 */
export type ActivitySourceType =
  | "issue"
  | "issue_comment"
  | "pull_request"
  | "pull_request_review_comment"
  | "discussion"
  | "discussion_comment";

export const ACTIVITY_SOURCE_TYPES = {
  DISCUSSION: "discussion",
  DISCUSSION_COMMENT: "discussion_comment",
  ISSUE: "issue",
  PULL_REQUEST: "pull_request",
} as const satisfies Record<string, ActivitySourceType>;

/**
 * Represents a single activity item fetched from a source.
 */
export interface ActivityItem {
  repo: string; // e.g., "owner/repo"
  sourceType: ActivitySourceType;
  id: string; // Unique ID from the source (e.g., discussion ID, comment ID)
  title: string;
  url: string;
  author: string;
  createdAt: string; // ISO 8601 format
  body?: string; // Optional body/content
  summary?: string; // Optional AI summary
}

/** Type guard to check if an item has a non-null summary */
export function hasSummary(item: ActivityItem): item is ActivityItem & { summary: string } {
  return typeof item.summary === "string" && item.summary.length > 0;
}
