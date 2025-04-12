export type GitHubAuthor = {
  login: string | null;
};

export type GitHubCommentNode = {
  id: string;
  createdAt: string;
  author: GitHubAuthor | null;
  bodyText: string | null;
  url: string;
  discussion: { title: string | null; url: string };
};

export type GitHubDiscussionNode = {
  id: string;
  title: string | null;
  url: string;
  createdAt: string;
  author: GitHubAuthor | null;
  bodyText: string | null;
  comments: { nodes: GitHubCommentNode[] };
};

export type GitHubQueryResult = {
  repository: { discussions: { nodes: GitHubDiscussionNode[] } } | null;
};
