import type { AppConfig } from '../interfaces/config.js';
import type { GraphQLResponse } from '../interfaces/github.js';
import { GITHUB_GRAPHQL_URL } from '../constants/index.js';
import { withRetry, GitHubApiError, RateLimitError } from '../utils/retry.js';

export class GitHubGraphQLClient {
  private readonly headers: Readonly<Record<string, string>>;

  constructor(config: AppConfig) {
    this.headers = {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'github-profile-stats-generator/1.0',
    };
  }

  async query<TData>(
    query: string,
    variables: Record<string, unknown> = {}
  ): Promise<TData> {
    return withRetry(
      async () => {
        const response = await fetch(GITHUB_GRAPHQL_URL, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({ query, variables }),
        });

        const remaining = Number(response.headers.get('x-ratelimit-remaining') ?? 1);
        const resetEpoch = Number(response.headers.get('x-ratelimit-reset') ?? 0);

        if (response.status === 403 && remaining === 0) {
          throw new RateLimitError(new Date(resetEpoch * 1000), remaining);
        }

        if (!response.ok) {
          throw new GitHubApiError(response.status, 'graphql', await response.text());
        }

        const json = (await response.json()) as GraphQLResponse<TData>;

        if (json.errors && json.errors.length > 0) {
          const messages = json.errors.map((e) => e.message).join('; ');
          throw new GitHubApiError(200, 'graphql', `GraphQL errors: ${messages}`);
        }

        if (json.data === undefined || json.data === null) {
          throw new GitHubApiError(200, 'graphql', 'Empty data in GraphQL response');
        }

        return json.data;
      },
      {
        onRetry: (attempt, err) =>
          console.warn(`  [GraphQL] retry ${attempt}: ${err.message}`),
      }
    );
  }
}
