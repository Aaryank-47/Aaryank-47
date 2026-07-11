import type { AppConfig } from '../interfaces/config.js';
import type { GitHubUser, GitHubRepository, GitHubLanguages, GitHubEvent } from '../interfaces/github.js';
import { GITHUB_API_BASE, MAX_REPOS_PER_PAGE } from '../constants/index.js';
import { withRetry, GitHubApiError, RateLimitError } from '../utils/retry.js';

export class GitHubRestClient {
  private readonly headers: Readonly<Record<string, string>>;

  constructor(config: AppConfig) {
    this.headers = {
      Authorization: `Bearer ${config.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'github-profile-stats-generator/1.0',
    };
  }

  // ─── Core fetch wrapper ─────────────────────────────────────────────────────

  private async get<T>(path: string): Promise<T> {
    const url = path.startsWith('http')
      ? path
      : `${GITHUB_API_BASE}${path}`;

    return withRetry(
      async () => {
        const response = await fetch(url, { headers: this.headers });

        const remaining = Number(response.headers.get('x-ratelimit-remaining') ?? 1);
        const resetEpoch = Number(response.headers.get('x-ratelimit-reset') ?? 0);

        if (response.status === 403 && remaining === 0) {
          throw new RateLimitError(new Date(resetEpoch * 1000), remaining);
        }

        if (!response.ok) {
          const body = await response.text();
          let message = body;
          try {
            const json = JSON.parse(body) as { message?: string };
            if (json.message) message = json.message;
          } catch {
            // keep raw body as message
          }
          throw new GitHubApiError(response.status, path, message);
        }

        return response.json() as Promise<T>;
      },
      {
        onRetry: (attempt, err) =>
          console.warn(`  [REST] retry ${attempt} for ${path}: ${err.message}`),
      }
    );
  }

  // ─── Pagination helper ──────────────────────────────────────────────────────

  private async getPaginated<T>(
    path: string,
    perPage = MAX_REPOS_PER_PAGE
  ): Promise<T[]> {
    const results: T[] = [];
    let page = 1;

    while (true) {
      const sep = path.includes('?') ? '&' : '?';
      const data = await this.get<T[]>(`${path}${sep}per_page=${perPage}&page=${page}`);

      results.push(...data);
      if (data.length < perPage) break;
      page++;
    }

    return results;
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  async getUser(username: string): Promise<GitHubUser> {
    return this.get<GitHubUser>(`/users/${username}`);
  }

  async getUserRepositories(username: string): Promise<GitHubRepository[]> {
    return this.getPaginated<GitHubRepository>(
      `/users/${username}/repos?sort=updated&type=owner`
    );
  }

  async getRepositoryLanguages(owner: string, repo: string): Promise<GitHubLanguages> {
    return this.get<GitHubLanguages>(`/repos/${owner}/${repo}/languages`);
  }

  async getUserEvents(username: string): Promise<GitHubEvent[]> {
    return this.getPaginated<GitHubEvent>(
      `/users/${username}/events`,
      100
    );
  }
}
