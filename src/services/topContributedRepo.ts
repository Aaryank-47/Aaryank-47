import type { GitHubGraphQLClient } from '../api/graphql.js';
import type { TopContributedRepoStats } from '../interfaces/stats.js';

const TOP_CONTRIBUTED_QUERY = /* GraphQL */ `
  query GetTopContributedRepo($username: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $username) {
      contributionsCollection(from: $from, to: $to) {
        commitContributionsByRepository(maxRepositories: 100) {
          repository {
            name
            owner { login }
            description
            stargazerCount
            forkCount
            primaryLanguage { name color }
            updatedAt
            url
          }
          contributions {
            totalCount
          }
        }
        issueContributionsByRepository(maxRepositories: 100) {
          repository {
            name
            owner { login }
            description
            stargazerCount
            forkCount
            primaryLanguage { name color }
            updatedAt
            url
          }
          contributions {
            totalCount
          }
        }
        pullRequestContributionsByRepository(maxRepositories: 100) {
          repository {
            name
            owner { login }
            description
            stargazerCount
            forkCount
            primaryLanguage { name color }
            updatedAt
            url
          }
          contributions {
            totalCount
          }
        }
        pullRequestReviewContributionsByRepository(maxRepositories: 100) {
          repository {
            name
            owner { login }
            description
            stargazerCount
            forkCount
            primaryLanguage { name color }
            updatedAt
            url
          }
          contributions {
            totalCount
          }
        }
      }
    }
  }
`;

interface GraphQLRepoNode {
  name: string;
  owner: { login: string };
  description: string | null;
  stargazerCount: number;
  forkCount: number;
  primaryLanguage: { name: string; color: string | null } | null;
  updatedAt: string;
  url: string;
}

interface RepoContributionItem {
  repository: GraphQLRepoNode;
  contributions: { totalCount: number };
}

interface TopContributedQueryResult {
  user: {
    contributionsCollection: {
      commitContributionsByRepository: RepoContributionItem[];
      issueContributionsByRepository: RepoContributionItem[];
      pullRequestContributionsByRepository: RepoContributionItem[];
      pullRequestReviewContributionsByRepository: RepoContributionItem[];
    };
  };
}

export async function fetchTopContributedRepo(
  graphql: GitHubGraphQLClient,
  username: string
): Promise<TopContributedRepoStats | null> {
  const currentYear = new Date().getFullYear();
  const yearsToQuery = [currentYear, currentYear - 1, currentYear - 2];

  const repoAggregates = new Map<
    string,
    {
      node: GraphQLRepoNode;
      count: number;
    }
  >();

  for (const year of yearsToQuery) {
    const from = new Date(year, 0, 1).toISOString();
    const to =
      year === currentYear
        ? new Date().toISOString()
        : new Date(year, 11, 31, 23, 59, 59).toISOString();

    try {
      const result = await graphql.query<TopContributedQueryResult>(
        TOP_CONTRIBUTED_QUERY,
        { username, from, to }
      );

      const col = result?.user?.contributionsCollection;
      if (!col) continue;

      const collections = [
        col.commitContributionsByRepository,
        col.issueContributionsByRepository,
        col.pullRequestContributionsByRepository,
        col.pullRequestReviewContributionsByRepository,
      ];

      for (const list of collections) {
        if (!Array.isArray(list)) continue;
        for (const item of list) {
          if (!item.repository) continue;
          const key = `${item.repository.owner.login}/${item.repository.name}`;
          const existing = repoAggregates.get(key);
          const added = item.contributions?.totalCount ?? 0;

          if (existing) {
            existing.count += added;
          } else {
            repoAggregates.set(key, {
              node: item.repository,
              count: added,
            });
          }
        }
      }
    } catch (err) {
      console.warn(`  [TopContributedRepo] Warning querying year ${year}:`, err);
    }
  }

  let topEntry: { node: GraphQLRepoNode; count: number } | null = null;
  for (const entry of repoAggregates.values()) {
    if (!topEntry || entry.count > topEntry.count) {
      topEntry = entry;
    }
  }

  if (!topEntry || topEntry.count === 0) {
    return null;
  }

  const { node, count } = topEntry;
  return {
    name: node.name,
    owner: node.owner.login,
    fullTitle: `${node.owner.login}/${node.name}`,
    description: node.description,
    contributionCount: count,
    language: node.primaryLanguage?.name ?? null,
    languageColor: node.primaryLanguage?.color ?? null,
    stars: node.stargazerCount,
    forks: node.forkCount,
    updatedAt: node.updatedAt,
    url: node.url,
  };
}
