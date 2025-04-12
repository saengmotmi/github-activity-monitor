export type ActivitySourceType = "discussion" | "discussion_comment" | "issue" | "pull_request";

export const ACTIVITY_SOURCE_TYPES = {
  DISCUSSION: "discussion",
  DISCUSSION_COMMENT: "discussion_comment",
  ISSUE: "issue",
  PULL_REQUEST: "pull_request",
} as const satisfies Record<string, ActivitySourceType>;

/** Represents a single activity item fetched from a source */
export type ActivityItem = {
  repo: string; // "owner/repo"
  sourceType: ActivitySourceType;
  id: string; // Unique ID from the source
  title: string;
  url: string;
  author: string;
  createdAt: string; // ISO 8601 format
  body: string; // For LLM summarization input
  summary?: string | null; // Optional LLM summary result
  state?: "open" | "closed" | "merged"; // Optional: for Issues/PRs
  labels?: string[]; // Optional: for Issues/PRs
};

/** Type guard to check if an item has a non-null summary */
export function hasSummary(item: ActivityItem): item is ActivityItem & { summary: string } {
  return typeof item.summary === "string" && item.summary.length > 0;
}
