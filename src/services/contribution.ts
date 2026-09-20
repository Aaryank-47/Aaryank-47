import type { GitHubGraphQLClient } from '../api/graphql.js';
import type { ContributionsCollection, ContributionDay } from '../interfaces/github.js';
import type { ContributionStats, StreakStats } from '../interfaces/stats.js';
import { createValidatedKPI, validateNumber } from './kpi.js';

// ─── GraphQL Queries ──────────────────────────────────────────────────────────

const CREATED_AT_QUERY = /* GraphQL */ `
  query GetAccountAge($username: String!) {
    user(login: $username) {
      createdAt
    }
  }
`;

const CONTRIBUTIONS_QUERY = /* GraphQL */ `
  query GetContributions($username: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $username) {
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        totalPullRequestReviewContributions
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
      }
    }
  }
`;

interface AccountAgeResult {
  user: { createdAt: string };
}

interface ContributionsResult {
  user: { contributionsCollection: ContributionsCollection };
}

// ─── Date Helpers ─────────────────────────────────────────────────────────────

function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0] ?? '';
}

function parseUTCDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y ?? 2026, (m ?? 1) - 1, d ?? 1));
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

function isOneDayApart(earlier: string, later: string): boolean {
  const d1 = parseUTCDate(earlier);
  const d2 = parseUTCDate(later);
  return Math.round((d2.getTime() - d1.getTime()) / 86_400_000) === 1;
}

function flattenDays(collection: ContributionsCollection): ContributionDay[] {
  return collection.contributionCalendar.weeks.flatMap((w) => w.contributionDays);
}

// ─── Streak Calculation ───────────────────────────────────────────────────────

function computeStreak(allDays: ContributionDay[]): StreakStats {
  if (allDays.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      todayContributions: 0,
      currentStreakStart: null,
      currentStreakEnd: null,
      longestStreakStart: null,
      longestStreakEnd: null,
    };
  }

  // Build O(1) lookup map and sort dates
  const dayMap = new Map<string, number>();
  for (const d of allDays) {
    dayMap.set(d.date, d.contributionCount);
  }

  const sortedDates = [...dayMap.keys()].sort(); // ascending
  const latestDateStr = sortedDates[sortedDates.length - 1] ?? toDateStr(new Date());
  const latestCount = dayMap.get(latestDateStr) ?? 0;

  const yesterdayDateStr = toDateStr(addDays(parseUTCDate(latestDateStr), -1));
  const yesterdayCount = dayMap.get(yesterdayDateStr) ?? 0;

  // Determine streak anchor (latest day if contributed, else yesterday)
  const anchorStr = latestCount > 0 ? latestDateStr : yesterdayCount > 0 ? yesterdayDateStr : null;

  // ── Current streak ───────────────────────────────────────────────────────
  let currentStreak = 0;
  let currentStreakStart: string | null = null;
  let currentStreakEnd: string | null = null;

  if (anchorStr) {
    let checkDate = parseUTCDate(anchorStr);
    for (let i = 0; i < 1000; i++) {
      const checkStr = toDateStr(checkDate);
      const count = dayMap.get(checkStr) ?? 0;
      if (count === 0) break;

      currentStreak++;
      if (currentStreakEnd === null) currentStreakEnd = checkStr;
      currentStreakStart = checkStr;
      checkDate = addDays(checkDate, -1);
    }
  }

  // ── Longest streak ───────────────────────────────────────────────────────
  let longestStreak = 0;
  let longestStreakStart: string | null = null;
  let longestStreakEnd: string | null = null;
  let tempStreak = 0;
  let tempStart: string | null = null;
  let prevDate: string | null = null;

  for (const dateStr of sortedDates) {
    const count = dayMap.get(dateStr) ?? 0;

    if (count > 0) {
      if (prevDate !== null && isOneDayApart(prevDate, dateStr)) {
        tempStreak++;
      } else {
        tempStreak = 1;
        tempStart = dateStr;
      }

      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
        longestStreakStart = tempStart;
        longestStreakEnd = dateStr;
      }
    } else {
      tempStreak = 0;
      tempStart = null;
    }

    prevDate = dateStr;
  }

  return {
    currentStreak,
    longestStreak,
    todayContributions: latestCount,
    currentStreakStart,
    currentStreakEnd,
    longestStreakStart,
    longestStreakEnd,
  };
}

// ─── Main Service ─────────────────────────────────────────────────────────────

export async function fetchContributionStats(
  graphql: GitHubGraphQLClient,
  username: string
): Promise<{ contribution: ContributionStats; streak: StreakStats }> {
  // Resolve account creation year
  const ageResult = await graphql.query<AccountAgeResult>(CREATED_AT_QUERY, { username });
  const accountCreatedAt = new Date(ageResult.user.createdAt);
  const startYear = accountCreatedAt.getFullYear();
  const currentYear = new Date().getFullYear();

  let lifetimeContributions = 0;
  let currentYearContributions = 0;
  let totalCommits = 0;
  let totalPRs = 0;
  let totalIssues = 0;
  let totalReviews = 0;
  const streakDays: ContributionDay[] = [];

  // Query all account years from startYear to currentYear for complete accuracy
  for (let year = startYear; year <= currentYear; year++) {
    const from = new Date(year, 0, 1).toISOString();
    const to =
      year === currentYear
        ? new Date().toISOString()
        : new Date(year, 11, 31, 23, 59, 59).toISOString();

    try {
      const result = await graphql.query<ContributionsResult>(CONTRIBUTIONS_QUERY, {
        username,
        from,
        to,
      });

      const col = result?.user?.contributionsCollection;
      if (!col) continue;

      const yearTotal = col.contributionCalendar?.totalContributions ?? 0;
      lifetimeContributions += yearTotal;
      totalCommits += col.totalCommitContributions ?? 0;
      totalPRs += col.totalPullRequestContributions ?? 0;
      totalIssues += col.totalIssueContributions ?? 0;
      totalReviews += col.totalPullRequestReviewContributions ?? 0;

      const days = flattenDays(col);
      streakDays.push(...days);

      if (year === currentYear) {
        currentYearContributions = yearTotal;
      }
    } catch (err) {
      console.warn(`  [Contribution] Warning: Failed fetching contributions for year ${year}:`, err);
    }
  }

  // Deduplicate contribution days by date
  const uniqueDayMap = new Map<string, ContributionDay>();
  for (const day of streakDays) {
    uniqueDayMap.set(day.date, day);
  }
  const allUniqueDays = Array.from(uniqueDayMap.values());

  const streak = computeStreak(allUniqueDays);

  // Validate KPIs via Validation Layer
  createValidatedKPI('lifetimeContributions', lifetimeContributions, 'GitHub GraphQL contributionsCollection', validateNumber);
  createValidatedKPI('currentYearContributions', currentYearContributions, 'GitHub GraphQL contributionsCollection', validateNumber);
  createValidatedKPI('currentStreak', streak.currentStreak, 'GitHub GraphQL contributionCalendar', validateNumber);
  createValidatedKPI('longestStreak', streak.longestStreak, 'GitHub GraphQL contributionCalendar', validateNumber);

  return {
    contribution: {
      currentYearContributions,
      lifetimeContributions,
      totalCommits,
      totalPRs,
      totalIssues,
      totalReviews,
    },
    streak,
  };
}
