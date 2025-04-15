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

export type GitHubDiscussionWithoutComments = {
  id: string;
  title: string | null;
  url: string;
  createdAt: string;
  author: GitHubAuthor | null;
  bodyText: string | null;
};

export type GitHubDiscussionWithComments = {
  id: string;
  title: string | null;
  url: string;
  comments: { nodes: GitHubCommentNode[] };
};

export type GitHubDiscussionsOnlyResult = {
  repository: { discussions: { nodes: GitHubDiscussionWithoutComments[] } } | null;
};

export type GitHubCommentsOnlyResult = {
  repository: { discussions: { nodes: GitHubDiscussionWithComments[] } } | null;
};
