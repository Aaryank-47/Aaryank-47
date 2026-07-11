// ─── REST API Response Types ─────────────────────────────────────────────────

export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  email: string | null;
  blog: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  fork: boolean;
  size: number;
  created_at: string;
  updated_at: string;
  pushed_at: string | null;
  topics: string[];
  visibility: string;
}

export interface GitHubLanguages {
  [language: string]: number;
}

export interface GitHubEventActor {
  login: string;
  display_login: string;
}

export interface GitHubEventRepo {
  id: number;
  name: string;
  url: string;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  url: string;
}

export interface GitHubPullRequest {
  title: string;
  html_url: string;
  state: string;
  merged: boolean;
}

export interface GitHubIssue {
  title: string;
  html_url: string;
  number: number;
}

export interface GitHubRelease {
  tag_name: string;
  name: string | null;
  html_url: string;
}

export interface GitHubEventPayload {
  ref?: string;
  ref_type?: string;
  action?: string;
  commits?: GitHubCommit[];
  pull_request?: GitHubPullRequest;
  issue?: GitHubIssue;
  release?: GitHubRelease;
  review?: { state: string };
}

export interface GitHubEvent {
  id: string;
  type: string;
  actor: GitHubEventActor;
  repo: GitHubEventRepo;
  payload: GitHubEventPayload;
  public: boolean;
  created_at: string;
}

// ─── GraphQL Response Types ───────────────────────────────────────────────────

export interface GraphQLError {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: string[];
  type?: string;
}

export interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLError[];
}

export interface ContributionDay {
  contributionCount: number;
  date: string;
}

export interface ContributionWeek {
  contributionDays: ContributionDay[];
}

export interface ContributionCalendar {
  totalContributions: number;
  weeks: ContributionWeek[];
}

export interface ContributionsCollection {
  totalCommitContributions: number;
  totalPullRequestContributions: number;
  totalIssueContributions: number;
  totalPullRequestReviewContributions: number;
  contributionCalendar: ContributionCalendar;
}

export interface GraphQLLanguageNode {
  name: string;
  color: string | null;
}

export interface GraphQLLanguageEdge {
  size: number;
  node: GraphQLLanguageNode;
}

export interface GraphQLLanguages {
  totalSize: number;
  edges: GraphQLLanguageEdge[];
}

export interface GraphQLPrimaryLanguage {
  name: string;
  color: string | null;
}

export interface GraphQLIssueConnection {
  totalCount: number;
}

export interface GraphQLPageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

export interface GraphQLRepository {
  name: string;
  description: string | null;
  url: string;
  stargazerCount: number;
  forkCount: number;
  isFork: boolean;
  diskUsage: number | null;
  updatedAt: string;
  pushedAt: string | null;
  primaryLanguage: GraphQLPrimaryLanguage | null;
  languages: GraphQLLanguages;
  issues: GraphQLIssueConnection;
}

export interface GraphQLRepositoryConnection {
  totalCount: number;
  pageInfo: GraphQLPageInfo;
  nodes: GraphQLRepository[];
}

export interface GraphQLFollowConnection {
  totalCount: number;
}

export interface GraphQLUser {
  name: string | null;
  login: string;
  avatarUrl: string;
  createdAt: string;
  followers: GraphQLFollowConnection;
  following: GraphQLFollowConnection;
  repositories: GraphQLRepositoryConnection;
  contributionsCollection: ContributionsCollection;
}
