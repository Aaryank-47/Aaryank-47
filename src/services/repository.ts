import type { GitHubGraphQLClient } from '../api/graphql.js';
import type { GraphQLRepository } from '../interfaces/github.js';
import type { RepositoryStats, RepositorySummary } from '../interfaces/stats.js';

// ─── GraphQL Query ────────────────────────────────────────────────────────────

const REPOS_QUERY = /* GraphQL */ `
  query GetUserRepositories($username: String!, $after: String) {
    user(login: $username) {
      followers { totalCount }
      following { totalCount }
      repositories(
        first: 100
        after: $after
        ownerAffiliations: OWNER
        orderBy: { field: STARGAZERS, direction: DESC }
      ) {
        totalCount
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          name
          description
          url
          stargazerCount
          forkCount
          isFork
          diskUsage
          updatedAt
          pushedAt
          primaryLanguage { name color }
          languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
            totalSize
            edges {
              size
              node { name color }
            }
          }
          issues(states: OPEN) { totalCount }
        }
      }
    }
  }
`;

// ─── Response Shape ───────────────────────────────────────────────────────────

interface QueryResult {
  user: {
    followers: { totalCount: number };
    following: { totalCount: number };
    repositories: {
      totalCount: number;
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      nodes: GraphQLRepository[];
    };
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export async function fetchRepositoryStats(
  graphql: GitHubGraphQLClient,
  username: string
): Promise<{ stats: RepositoryStats; repositories: GraphQLRepository[] }> {
  const allRepos: GraphQLRepository[] = [];
  let cursor: string | null = null;
  let followers = 0;
  let following = 0;
  let totalCount = 0;

  // Paginate through all owned repositories
  do {
    const result: QueryResult = await graphql.query<QueryResult>(REPOS_QUERY, {
      username,
      ...(cursor !== null ? { after: cursor } : {}),
    });

    const { user } = result;
    followers = user.followers.totalCount;
    following = user.following.totalCount;
    totalCount = user.repositories.totalCount;
    allRepos.push(...user.repositories.nodes);

    const pageInfo = user.repositories.pageInfo;
    cursor = pageInfo.hasNextPage ? (pageInfo.endCursor ?? null) : null;
  } while (cursor !== null);

  // Exclude forks from aggregation
  const ownRepos = allRepos.filter((r) => !r.isFork);

  const totalStars = ownRepos.reduce((acc, r) => acc + r.stargazerCount, 0);
  const totalForks = ownRepos.reduce((acc, r) => acc + r.forkCount, 0);
  const totalIssues = ownRepos.reduce((acc, r) => acc + r.issues.totalCount, 0);
  const totalSizeKb = ownRepos.reduce((acc, r) => acc + (r.diskUsage ?? 0), 0);

  const topRepositories: RepositorySummary[] = ownRepos
    .sort((a, b) => b.stargazerCount - a.stargazerCount)
    .slice(0, 6)
    .map(
      (r): RepositorySummary => ({
        name: r.name,
        description: r.description,
        url: r.url,
        stars: r.stargazerCount,
        forks: r.forkCount,
        language: r.primaryLanguage?.name ?? null,
        languageColor: r.primaryLanguage?.color ?? null,
        updatedAt: r.updatedAt,
      })
    );

  return {
    stats: { totalRepos: totalCount, totalStars, totalForks, totalIssues, totalSizeKb, followers, following, topRepositories },
    repositories: allRepos,
  };
}
