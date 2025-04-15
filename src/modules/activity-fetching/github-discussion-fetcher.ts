import { graphql, GraphqlResponseError } from "@octokit/graphql";
import { AppConfig } from "../../configs/app-config";
import { ActivityItem, ActivitySourceType } from "../../models/activity";
import { RepositoryLastProcessed } from "../../models/state";
import { ISingleSourceActivityFetcher } from "./activity-fetcher";
import { GitHubCommentsOnlyResult, GitHubDiscussionsOnlyResult } from "./fetch-response";

// 토론만 가져오는 쿼리
const DISCUSSIONS_QUERY = `
    query GetDiscussions(
      $owner: String!,
      $name: String!,
      $discCount: Int!
    ) {
      repository(owner: $owner, name: $name) {
        discussions(first: $discCount, orderBy: {field: CREATED_AT, direction: DESC}) {
          nodes {
            id title url createdAt author { login } bodyText
          }
        }
      }
    }
`;

// 댓글만 가져오는 쿼리
const DISCUSSION_COMMENTS_QUERY = `
    query GetDiscussionComments(
      $owner: String!,
      $name: String!,
      $commCount: Int!
    ) {
      repository(owner: $owner, name: $name) {
        discussions(first: 30) {
          nodes {
            id
            title
            url
            comments(first: $commCount) {
              nodes {
                id createdAt author { login } bodyText url
                discussion { title url }
              }
            }
          }
        }
      }
    }
`;

export class GithubDiscussionFetcher implements ISingleSourceActivityFetcher {
  private readonly graphqlWithAuth: typeof graphql;

  public constructor(private readonly config: AppConfig) {
    this.graphqlWithAuth = graphql.defaults({
      headers: { authorization: `token ${config.githubPat}` },
    });
    console.log("GithubDiscussionFetcher initialized.");
  }

  public getSourceType(): ActivitySourceType[] {
    return ["discussion", "discussion_comment"];
  }

  private processDiscussionsData(
    repoFullName: string,
    repositoryData: GitHubDiscussionsOnlyResult["repository"],
    lastDiscussionTimestamp: string
  ): ActivityItem[] {
    const activities: ActivityItem[] = [];
    if (!repositoryData?.discussions?.nodes) return activities;

    for (const discussion of repositoryData.discussions.nodes) {
      if (new Date(discussion.createdAt) > new Date(lastDiscussionTimestamp)) {
        activities.push({
          repo: repoFullName,
          sourceType: "discussion",
          id: discussion.id,
          title: `📝 새 글 [${discussion.title}]`,
          url: discussion.url,
          author: discussion.author?.login || "Unknown",
          createdAt: discussion.createdAt,
          body: discussion.bodyText || "",
        });
      }
    }
    return activities;
  }

  private processCommentsData(
    repoFullName: string,
    repositoryData: GitHubCommentsOnlyResult["repository"],
    lastCommentTimestamp: string
  ): ActivityItem[] {
    const activities: ActivityItem[] = [];
    if (!repositoryData?.discussions?.nodes) return activities;

    for (const discussion of repositoryData.discussions.nodes) {
      if (!discussion.comments?.nodes) continue;

      for (const comment of discussion.comments.nodes) {
        if (new Date(comment.createdAt) > new Date(lastCommentTimestamp)) {
          activities.push({
            repo: repoFullName,
            sourceType: "discussion_comment",
            id: comment.id,
            title: `💬 새 댓글 - 원문 [${comment.discussion?.title || discussion.title}]`,
            url: comment.url,
            author: comment.author?.login || "Unknown",
            createdAt: comment.createdAt,
            body: comment.bodyText || "",
          });
        }
      }
    }
    return activities;
  }

  private async fetchDiscussions(
    owner: string,
    name: string,
    lastDiscussionTimestamp: string
  ): Promise<ActivityItem[]> {
    try {
      const result = await this.graphqlWithAuth<GitHubDiscussionsOnlyResult>(DISCUSSIONS_QUERY, {
        owner,
        name,
        discCount: this.config.maxItemsPerRun,
      });

      return this.processDiscussionsData(
        `${owner}/${name}`,
        result.repository,
        lastDiscussionTimestamp
      );
    } catch (error) {
      console.error(`Error fetching discussions for ${owner}/${name}:`, error);
      return [];
    }
  }

  private async fetchComments(
    owner: string,
    name: string,
    lastCommentTimestamp: string
  ): Promise<ActivityItem[]> {
    try {
      const result = await this.graphqlWithAuth<GitHubCommentsOnlyResult>(
        DISCUSSION_COMMENTS_QUERY,
        {
          owner,
          name,
          commCount: this.config.maxItemsPerRun * 5,
        }
      );

      return this.processCommentsData(`${owner}/${name}`, result.repository, lastCommentTimestamp);
    } catch (error) {
      console.error(`Error fetching discussion comments for ${owner}/${name}:`, error);
      return [];
    }
  }

  public async fetchNewActivities(
    repoFullName: string,
    repoLastProcessed: RepositoryLastProcessed
  ): Promise<ActivityItem[]> {
    const [owner, name] = repoFullName.split("/");
    if (!owner || !name) return [];

    const lastDiscussionTimestamp =
      repoLastProcessed.discussion?.lastTimestamp || new Date(0).toISOString();
    const lastCommentTimestamp =
      repoLastProcessed.discussion_comment?.lastTimestamp || new Date(0).toISOString();

    console.log(
      `Fetching Discussions/Comments for ${repoFullName} since D:${lastDiscussionTimestamp}, C:${lastCommentTimestamp}`
    );

    try {
      // 병렬로 토론과 댓글 데이터 가져오기
      const [discussionActivities, commentActivities] = await Promise.all([
        this.fetchDiscussions(owner, name, lastDiscussionTimestamp),
        this.fetchComments(owner, name, lastCommentTimestamp),
      ]);

      // 결과 합치기
      return [...discussionActivities, ...commentActivities];
    } catch (error: unknown) {
      if (error instanceof GraphqlResponseError) {
        if (error.message.includes("rate limit exceeded"))
          console.warn(`Rate limit exceeded for ${repoFullName} discussions.`);
        else if (error.errors?.some((e) => e.type === "NOT_FOUND"))
          console.warn(
            `Repo/Discussions not found or insufficient permissions for ${repoFullName}.`
          );
        else
          console.error(
            `GraphQL error fetching discussions for ${repoFullName}:`,
            JSON.stringify(error.errors, null, 2)
          );
      } else if (error instanceof Error)
        console.error(`Network error fetching discussions for ${repoFullName}:`, error.message);
      else console.error(`Unknown error fetching discussions for ${repoFullName}:`, error);
      return [];
    }
  }
}
