import type { GitHubRestClient } from '../api/rest.js';
import type { GitHubEvent } from '../interfaces/github.js';
import type { ActivityItem, RecentActivityStats } from '../interfaces/stats.js';
import { EVENT_LABELS } from '../constants/index.js';
import { truncate, formatRelativeTime } from '../utils/format.js';
import { createValidatedKPI, validateString } from './kpi.js';

// ─── Event parsers ────────────────────────────────────────────────────────────

function parseEvent(event: GitHubEvent): ActivityItem | null {
  if (!event || !event.repo || !event.repo.name) return null;

  const repo = event.repo.name;
  const repoUrl = `https://github.com/${repo}`;
  const date = formatRelativeTime(event.created_at);
  const label = EVENT_LABELS[event.type] ?? event.type;

  switch (event.type) {
    case 'PushEvent': {
      const commits = event.payload.commits ?? [];
      const count = commits.length;

      if (count === 0) {
        return {
          type: 'push',
          description: `Pushed updates to repository`,
          repo,
          repoUrl,
          date,
          url: repoUrl,
        };
      }

      const first = commits[0];
      const msgLine = first?.message?.split('\n')[0] ?? '';
      const msg = msgLine.trim() !== '' ? truncate(msgLine, 55) : 'Commit updates';
      const commitUrl = first?.sha
        ? `https://github.com/${repo}/commit/${first.sha}`
        : repoUrl;

      return {
        type: 'push',
        description: `Pushed ${count} commit${count !== 1 ? 's' : ''}: "${msg}"`,
        repo,
        repoUrl,
        date,
        url: commitUrl,
      };
    }

    case 'CreateEvent': {
      const refType = event.payload.ref_type ?? 'repository';
      const ref = event.payload.ref;
      const desc = ref
        ? `${label} ${refType} "${truncate(ref, 40)}"`
        : `${label} ${refType}`;
      return { type: 'create', description: desc, repo, repoUrl, date, url: repoUrl };
    }

    case 'PullRequestEvent': {
      const pr = event.payload.pull_request;
      if (!pr || !pr.title) return null;
      const action = event.payload.action ?? 'updated';
      const title = truncate(pr.title, 50);
      return {
        type: 'pr',
        description: `${label} ${action}: "${title}"`,
        repo,
        repoUrl,
        date,
        url: pr.html_url || repoUrl,
      };
    }

    case 'IssuesEvent': {
      const issue = event.payload.issue;
      if (!issue || !issue.title) return null;
      const action = event.payload.action ?? 'updated';
      const title = truncate(issue.title, 50);
      return {
        type: 'issue',
        description: `${label} ${action}: "${title}"`,
        repo,
        repoUrl,
        date,
        url: issue.html_url || repoUrl,
      };
    }

    case 'WatchEvent':
      return { type: 'star', description: `${label} repository`, repo, repoUrl, date, url: repoUrl };

    case 'ForkEvent':
      return { type: 'fork', description: 'Forked repository', repo, repoUrl, date, url: repoUrl };

    case 'ReleaseEvent': {
      const release = event.payload.release;
      if (!release) return null;
      const relName = release.name ?? release.tag_name ?? 'release';
      return {
        type: 'release',
        description: `Released ${truncate(relName, 45)}`,
        repo,
        repoUrl,
        date,
        url: release.html_url || repoUrl,
      };
    }

    case 'PullRequestReviewEvent': {
      const review = event.payload.review;
      const state = review?.state ?? 'commented';
      return {
        type: 'review',
        description: `Reviewed PR (${state})`,
        repo,
        repoUrl,
        date,
        url: repoUrl,
      };
    }

    default:
      return {
        type: 'other',
        description: `${label} activity`,
        repo,
        repoUrl,
        date,
        url: repoUrl,
      };
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export async function fetchRecentActivity(
  rest: GitHubRestClient,
  username: string
): Promise<RecentActivityStats> {
  const events = await rest.getUserEvents(username);

  const activities: ActivityItem[] = [];
  const seenRepoPush = new Set<string>();

  for (const event of events) {
    if (activities.length >= 8) break;

    const item = parseEvent(event);
    if (!item || !validateString(item.description)) continue;

    // Skip duplicate push events to the same repo
    if (item.type === 'push') {
      if (seenRepoPush.has(item.repo)) continue;
      seenRepoPush.add(item.repo);
    }

    activities.push(item);
  }

  createValidatedKPI('recentActivitiesCount', activities.length, 'GitHub REST events API', (n) => n >= 0);

  return { activities };
}
