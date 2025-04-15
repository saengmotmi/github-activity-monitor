import { beforeEach, describe, expect, it, vi } from "vitest";
import { GithubDiscussionFetcher } from "./github-discussion-fetcher";
import { AppConfig } from "../../configs/app-config";
import { RepositoryLastProcessed } from "../../models/state";
import { graphql } from "@octokit/graphql";
import { GitHubQueryResult } from "./fetch-response";
import { createMockConfig, silenceConsoleOutput } from "../../__tests__/test-utils";

// Mock the @octokit/graphql module
vi.mock("@octokit/graphql", () => {
  const mockGraphqlFn = vi.fn();
  // @ts-expect-error: The defaults property exists but has typing issues
  mockGraphqlFn.defaults = vi.fn().mockReturnValue(mockGraphqlFn);

  return {
    graphql: mockGraphqlFn,
    // GraphqlResponseError is removed (since error test cases are removed)
  };
});

describe("GithubDiscussionFetcher", () => {
  const graphqlMock = vi.mocked(graphql);
  let mockConfig: AppConfig;
  let fetcher: GithubDiscussionFetcher;

  // Test data
  const repoFullName = "owner/repo";

  // Sample API response data - simplified
  const successfulDiscussionsResponse = {
    repository: {
      discussions: {
        nodes: [
          {
            id: "D_1",
            title: "Test Discussion 1",
            url: "https://github.com/owner/repo/discussions/1",
            createdAt: "2023-02-15T10:00:00Z",
            author: { login: "user1" },
            bodyText: "This is test discussion 1",
          },
          {
            id: "D_2",
            title: "Test Discussion 2",
            url: "https://github.com/owner/repo/discussions/2",
            createdAt: "2023-02-10T10:00:00Z",
            author: { login: "user3" },
            bodyText: "This is test discussion 2",
          },
        ],
      },
    },
  };

  const successfulCommentsResponse = {
    repository: {
      discussions: {
        nodes: [
          {
            id: "D_1",
            title: "Test Discussion 1",
            url: "https://github.com/owner/repo/discussions/1",
            comments: {
              nodes: [
                {
                  id: "DC_1",
                  createdAt: "2023-02-15T11:00:00Z",
                  author: { login: "user2" },
                  bodyText: "Comment on discussion 1",
                  url: "https://github.com/owner/repo/discussions/1#comment-1",
                  discussion: {
                    title: "Test Discussion 1",
                    url: "https://github.com/owner/repo/discussions/1",
                  },
                },
              ],
            },
          },
          {
            id: "D_2",
            title: "Test Discussion 2",
            url: "https://github.com/owner/repo/discussions/2",
            comments: {
              nodes: [
                {
                  id: "DC_2",
                  createdAt: "2023-02-16T09:00:00Z",
                  author: { login: "user4" },
                  bodyText: "Recent comment on discussion 2",
                  url: "https://github.com/owner/repo/discussions/2#comment-2",
                  discussion: {
                    title: "Test Discussion 2",
                    url: "https://github.com/owner/repo/discussions/2",
                  },
                },
              ],
            },
          },
        ],
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock console methods
    silenceConsoleOutput();

    // Prepare default configuration
    mockConfig = createMockConfig({
      githubPat: "mock-github-pat",
      maxItemsPerRun: 10,
    });

    // Set default GraphQL response - now we'll have two separate responses
    graphqlMock.mockImplementation((query, variables) => {
      if (query.includes("GetDiscussions")) {
        return Promise.resolve(successfulDiscussionsResponse);
      } else if (query.includes("GetDiscussionComments")) {
        return Promise.resolve(successfulCommentsResponse);
      }
      return Promise.resolve({});
    });

    // Create test instance
    fetcher = new GithubDiscussionFetcher(mockConfig);
  });

  it("should configure graphql client with auth token", () => {
    expect(graphqlMock.defaults).toHaveBeenCalledWith({
      headers: { authorization: `token ${mockConfig.githubPat}` },
    });
  });

  it("should return both discussion and discussion_comment source types", () => {
    const sourceTypes = fetcher.getSourceType();
    expect(sourceTypes).toContain("discussion");
    expect(sourceTypes).toContain("discussion_comment");
    expect(sourceTypes).toHaveLength(2);
  });

  it("should fetch new discussions and comments after last processed timestamp", async () => {
    // Setup last processed state
    const lastProcessed: RepositoryLastProcessed = {
      discussion: { lastTimestamp: "2023-02-01T00:00:00Z" },
      discussion_comment: { lastTimestamp: "2023-02-01T00:00:00Z" },
    };

    // Run test
    const activities = await fetcher.fetchNewActivities(repoFullName, lastProcessed);

    // Verify GraphQL calls (now two separate calls)
    expect(graphqlMock).toHaveBeenCalledTimes(2);

    // Verify discussions query
    expect(graphqlMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("GetDiscussions"),
      expect.objectContaining({
        owner: "owner",
        name: "repo",
        discCount: mockConfig.maxItemsPerRun,
      })
    );

    // Verify comments query
    expect(graphqlMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("GetDiscussionComments"),
      expect.objectContaining({
        owner: "owner",
        name: "repo",
        commCount: mockConfig.maxItemsPerRun * 5,
      })
    );

    // Verify activity results
    expect(activities).toHaveLength(4); // 2 discussions + 2 comments

    // Verify discussion transformations
    const discussions = activities.filter((a) => a.sourceType === "discussion");
    expect(discussions).toHaveLength(2);
    expect(discussions[0]).toMatchObject({
      repo: repoFullName,
      sourceType: "discussion",
      id: "D_1",
      title: expect.stringContaining("Test Discussion 1"),
      author: "user1",
      createdAt: "2023-02-15T10:00:00Z",
    });

    // Verify comment transformations
    const comments = activities.filter((a) => a.sourceType === "discussion_comment");
    expect(comments).toHaveLength(2);
    expect(comments[0]).toMatchObject({
      repo: repoFullName,
      sourceType: "discussion_comment",
      id: "DC_1",
      title: expect.stringContaining("Test Discussion 1"),
      author: "user2",
      createdAt: "2023-02-15T11:00:00Z",
    });
  });

  it("should not return discussions older than last processed timestamp", async () => {
    const lastProcessed: RepositoryLastProcessed = {
      discussion: { lastTimestamp: "2023-02-12T00:00:00Z" }, // After D_2, before D_1
      discussion_comment: { lastTimestamp: "2023-02-01T00:00:00Z" },
    };

    const activities = await fetcher.fetchNewActivities(repoFullName, lastProcessed);

    const discussions = activities.filter((a) => a.sourceType === "discussion");
    expect(discussions).toHaveLength(1);
    expect(discussions[0].id).toBe("D_1");
  });

  it("should not return comments older than last processed timestamp", async () => {
    const lastProcessed: RepositoryLastProcessed = {
      discussion: { lastTimestamp: "2023-02-01T00:00:00Z" },
      discussion_comment: { lastTimestamp: "2023-02-15T12:00:00Z" }, // After DC_1, before DC_2
    };

    const activities = await fetcher.fetchNewActivities(repoFullName, lastProcessed);

    const comments = activities.filter((a) => a.sourceType === "discussion_comment");
    expect(comments).toHaveLength(1);
    expect(comments[0].id).toBe("DC_2");
  });

  it("should return empty array for invalid repository name", async () => {
    const activities = await fetcher.fetchNewActivities("invalid-format", {});
    expect(activities).toEqual([]);
    expect(graphqlMock).not.toHaveBeenCalled();
  });

  it("should handle empty repository response", async () => {
    // For this test, override the mock to return empty discussions and comments
    graphqlMock.mockImplementation((query) => {
      return Promise.resolve({
        repository: {
          discussions: {
            nodes: [],
          },
        },
      });
    });

    const activities = await fetcher.fetchNewActivities(repoFullName, {});
    expect(activities).toEqual([]);
  });
});
