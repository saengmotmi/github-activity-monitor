import { beforeEach, describe, expect, it, vi } from "vitest";
import { createActivity, silenceConsoleOutput } from "../../__tests__/test-utils";
import { ActivityItem } from "../../models/activity";
import { RepoConfig } from "../../models/config";
import { LastProcessedState, RepositoryLastProcessed } from "../../models/state";
import { ISingleSourceActivityFetcher } from "./activity-fetcher";
import { GithubActivityAggregator } from "./github-activity-aggregator";

describe("GithubActivityAggregator", () => {
  // Mock fetchers for testing
  const mockDiscussionFetcher: ISingleSourceActivityFetcher = {
    fetchNewActivities: vi.fn() as any,
    getSourceType: vi.fn().mockReturnValue(["discussion", "discussion_comment"]),
  };

  const mockIssueFetcher: ISingleSourceActivityFetcher = {
    fetchNewActivities: vi.fn() as any,
    getSourceType: vi.fn().mockReturnValue("issue"),
  };

  // Test data
  const repoConfigs: RepoConfig[] = [
    {
      name: "owner/repo1",
      monitorTypes: ["discussion", "discussion_comment"],
    },
    {
      name: "owner/repo2",
      monitorTypes: ["issue"],
    },
  ];

  // Create test activity items using utility function
  const discussionActivities: ActivityItem[] = [
    createActivity({
      id: "D_1",
      repo: "owner/repo1",
      sourceType: "discussion",
      title: "Discussion 1",
      createdAt: "2023-02-15T10:00:00Z",
      body: "Discussion content",
      author: "user1",
      url: "https://github.com/owner/repo1/discussions/1",
    }),
    createActivity({
      id: "DC_1",
      repo: "owner/repo1",
      sourceType: "discussion_comment",
      title: "Comment on Discussion 1",
      createdAt: "2023-02-16T10:00:00Z",
      body: "Comment content",
      author: "user2",
      url: "https://github.com/owner/repo1/discussions/1#comment-1",
    }),
  ];

  const issueActivities: ActivityItem[] = [
    createActivity({
      id: "I_1",
      repo: "owner/repo2",
      sourceType: "issue",
      title: "Issue 1",
      createdAt: "2023-02-14T10:00:00Z",
      body: "Issue content",
      author: "user3",
      url: "https://github.com/owner/repo2/issues/1",
    }),
  ];

  let consoleMocks: ReturnType<typeof silenceConsoleOutput>;
  let aggregator: GithubActivityAggregator;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock console methods
    consoleMocks = silenceConsoleOutput();

    // Configure fetchNewActivities mocks
    (mockDiscussionFetcher.fetchNewActivities as any).mockImplementation(
      (repoFullName: string, repoLastProcessed: RepositoryLastProcessed) => {
        if (repoFullName === "owner/repo1") {
          return Promise.resolve(discussionActivities);
        }
        return Promise.resolve([]);
      }
    );

    (mockIssueFetcher.fetchNewActivities as any).mockImplementation(
      (repoFullName: string, repoLastProcessed: RepositoryLastProcessed) => {
        if (repoFullName === "owner/repo2") {
          return Promise.resolve(issueActivities);
        }
        return Promise.resolve([]);
      }
    );

    // Create aggregator instance
    aggregator = new GithubActivityAggregator(
      {
        discussionFetcher: mockDiscussionFetcher,
        issueFetcher: mockIssueFetcher,
      },
      repoConfigs
    );
  });

  it("should register fetchers for each activity type", () => {
    // Verify aggregator initialization logs
    expect(consoleMocks.logSpy).toHaveBeenCalledWith(
      expect.stringContaining("Registered fetcher for type(s): discussion, discussion_comment")
    );
    expect(consoleMocks.logSpy).toHaveBeenCalledWith(
      expect.stringContaining("Registered fetcher for type(s): issue")
    );
    expect(consoleMocks.logSpy).toHaveBeenCalledWith(
      expect.stringContaining("GithubActivityAggregator initialized for 2 repo configurations")
    );
  });

  it("should fetch activities from all configured repositories", async () => {
    const lastProcessedState: LastProcessedState = {
      "owner/repo1": {
        discussion: { lastTimestamp: "2023-01-01T00:00:00Z" },
        discussion_comment: { lastTimestamp: "2023-01-01T00:00:00Z" },
      },
      "owner/repo2": {
        issue: { lastTimestamp: "2023-01-01T00:00:00Z" },
      },
    };

    const activities = await aggregator.fetchNewActivities(lastProcessedState);

    // Verify all activities were fetched
    expect(activities).toHaveLength(3); // 2 discussions + 1 issue

    // Verify each fetcher was called
    expect(mockDiscussionFetcher.fetchNewActivities).toHaveBeenCalledWith(
      "owner/repo1",
      lastProcessedState["owner/repo1"]
    );
    expect(mockIssueFetcher.fetchNewActivities).toHaveBeenCalledWith(
      "owner/repo2",
      lastProcessedState["owner/repo2"]
    );

    // Verify results are sorted by creation date
    expect(activities[0].id).toBe("I_1"); // 2023-02-14
    expect(activities[1].id).toBe("D_1"); // 2023-02-15
    expect(activities[2].id).toBe("DC_1"); // 2023-02-16
  });

  it("should warn about missing fetchers for requested types", async () => {
    // Add configuration requesting PR type (no fetcher registered)
    const configsWithMissingFetcher: RepoConfig[] = [
      ...repoConfigs,
      {
        name: "owner/repo3",
        monitorTypes: ["pull_request"], // No fetcher registered
      },
    ];

    const aggregatorWithMissingFetcher = new GithubActivityAggregator(
      {
        discussionFetcher: mockDiscussionFetcher,
        issueFetcher: mockIssueFetcher,
      },
      configsWithMissingFetcher
    );

    await aggregatorWithMissingFetcher.fetchNewActivities({});

    // Verify warning was shown
    expect(consoleMocks.warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('No registered fetcher found for type "pull_request"')
    );

    // Results from registered fetchers still returned
    expect(mockDiscussionFetcher.fetchNewActivities).toHaveBeenCalled();
    expect(mockIssueFetcher.fetchNewActivities).toHaveBeenCalled();
  });

  it("should handle errors from individual fetchers", async () => {
    // Configure fetcher to throw error
    (mockDiscussionFetcher.fetchNewActivities as any).mockRejectedValueOnce(
      new Error("Fetch error")
    );

    const activities = await aggregator.fetchNewActivities({});

    // Error occurred but issue fetcher results still returned
    expect(activities).toHaveLength(1);
    expect(activities[0].id).toBe("I_1");

    // Verify error log
    expect(consoleMocks.errorSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "Fetcher for type(s) [discussion, discussion_comment] failed unexpectedly"
      ),
      expect.any(Error)
    );
  });

  it("should return empty array when no new activities are found", async () => {
    // Configure all fetchers to return empty arrays
    (mockDiscussionFetcher.fetchNewActivities as any).mockResolvedValueOnce([]);
    (mockIssueFetcher.fetchNewActivities as any).mockResolvedValueOnce([]);

    const activities = await aggregator.fetchNewActivities({});

    expect(activities).toEqual([]);
    expect(consoleMocks.logSpy).toHaveBeenCalledWith(
      expect.stringContaining("Aggregated fetch complete. Found 0 new activities")
    );
  });
});
