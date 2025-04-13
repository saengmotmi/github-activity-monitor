import { graphql, GraphqlResponseError } from "@octokit/graphql";
import { ActivityItem, ActivitySourceType } from "../../models/activity";
import { RepositoryLastProcessed } from "../../models/state";
import { ISingleSourceActivityFetcher } from "./activity-fetcher";
import { GitHubQueryResult } from "./fetch-response";
import { AppConfig } from "../../configs/app-config";

const DISCUSSION_QUERY = `
    query GetDiscussionsAndComments(
      $owner: String!,
      $name: String!,
      $discCount: Int!,
      $commCount: Int!
    ) {
      repository(owner: $owner, name: $name) {
        discussions(first: $discCount, orderBy: {field: CREATED_AT, direction: DESC}) {
          nodes {
            id title url createdAt author { login } bodyText
            comments(last: $commCount) {
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

  private processDiscussionData(
    repoFullName: string,
    repositoryData: GitHubQueryResult["repository"],
    lastDiscussionTimestamp: string,
    lastCommentTimestamp: string
  ): ActivityItem[] {
    const activities: ActivityItem[] = [];
    if (!repositoryData?.discussions?.nodes) return activities;

    for (const discussion of repositoryData.discussions.nodes) {
      if (new Date(discussion.createdAt) > new Date(lastDiscussionTimestamp)) {
        activities.push({
          repo: repoFullName,
          sourceType: "discussion",
          id: discussion.id,
          title: discussion.title || "Untitled Discussion",
          url: discussion.url,
          author: discussion.author?.login || "Unknown",
          createdAt: discussion.createdAt,
          body: discussion.bodyText || "",
        });
      }

      if (discussion.comments?.nodes) {
        for (const comment of discussion.comments.nodes) {
          const originalDiscussionTitle = discussion.title || "Original Discussion";
          if (new Date(comment.createdAt) > new Date(lastCommentTimestamp)) {
            activities.push({
              repo: repoFullName,
              sourceType: "discussion_comment",
              id: comment.id,
              title: `Re: ${comment.discussion?.title || originalDiscussionTitle}`,
              url: comment.url,
              author: comment.author?.login || "Unknown",
              createdAt: comment.createdAt,
              body: comment.bodyText || "",
            });
          }
        }
      }
    }
    return activities;
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
      const result = await this.graphqlWithAuth<GitHubQueryResult>(DISCUSSION_QUERY, {
        owner,
        name,
        discCount: this.config.maxItemsPerRun,
        commCount: this.config.maxItemsPerRun,
      });

      return this.processDiscussionData(
        repoFullName,
        result.repository,
        lastDiscussionTimestamp,
        lastCommentTimestamp
      );
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
