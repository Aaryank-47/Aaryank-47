import type { GitHubGraphQLClient } from '../api/graphql.js';
import type { DiscoveredRepository } from '../interfaces/repository.js';

const DISCOVERY_QUERY = /* GraphQL */ `
  query DiscoverUserRepositories($username: String!, $after: String) {
    user(login: $username) {
      repositories(
        first: 100
        after: $after
        ownerAffiliations: [OWNER, COLLABORATOR]
        orderBy: { field: PUSHED_AT, direction: DESC }
      ) {
        totalCount
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          databaseId
          name
          isPrivate
          isFork
          stargazerCount
          forkCount
          updatedAt
          pushedAt
          url
          description
          owner {
            login
          }
          primaryLanguage {
            name
            color
          }
        }
      }
    }
  }
`;

interface GraphQLRepoNode {
  databaseId: number;
  name: string;
  isPrivate: boolean;
  isFork: boolean;
  stargazerCount: number;
  forkCount: number;
  updatedAt: string;
  pushedAt: string;
  url: string;
  description: string | null;
  owner: { login: string };
  primaryLanguage: { name: string; color: string | null } | null;
}

interface DiscoveryQueryResult {
  user: {
    repositories: {
      totalCount: number;
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string | null;
      };
      nodes: GraphQLRepoNode[];
    };
  };
}

export async function discoverAllRepositories(
  graphql: GitHubGraphQLClient,
  username: string
): Promise<DiscoveredRepository[]> {
  const repositories: DiscoveredRepository[] = [];
  let cursor: string | null = null;

  do {
    const result: DiscoveryQueryResult = await graphql.query<DiscoveryQueryResult>(
      DISCOVERY_QUERY,
      {
        username,
        ...(cursor !== null ? { after: cursor } : {}),
      }
    );

    const repoData = result?.user?.repositories;
    if (!repoData) break;

    for (const node of repoData.nodes) {
      const owner = node.owner.login;
      const isOwner = owner.toLowerCase() === username.toLowerCase();

      repositories.push({
        id: node.databaseId || Math.abs(hashCode(`${owner}/${node.name}`)),
        name: node.name,
        owner,
        fullTitle: `${owner}/${node.name}`,
        isPrivate: node.isPrivate,
        isFork: node.isFork,
        isOwner,
        stargazerCount: node.stargazerCount,
        forkCount: node.forkCount,
        pushedAt: node.pushedAt,
        updatedAt: node.updatedAt,
        primaryLanguage: node.primaryLanguage?.name ?? null,
        description: node.description,
        url: node.url,
      });
    }

    const pageInfo = repoData.pageInfo;
    cursor = pageInfo.hasNextPage ? (pageInfo.endCursor ?? null) : null;
  } while (cursor !== null);

  return repositories;
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}
