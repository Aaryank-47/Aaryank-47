import type { GitHubGraphQLClient } from '../api/graphql.js';
import type { ContributionsCollection, ContributionDay } from '../interfaces/github.js';
import type { ContributionStats, StreakStats } from '../interfaces/stats.js';

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

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function isOneDayApart(earlier: string, later: string): boolean {
  return (
    new Date(later).getTime() - new Date(earlier).getTime() === 86_400_000
  );
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

  // Build O(1) lookup map
  const dayMap = new Map<string, number>();
  for (const d of allDays) {
    dayMap.set(d.date, d.contributionCount);
  }

  const todayStr = toDateStr(new Date());
  const yesterdayStr = toDateStr(addDays(new Date(), -1));
  const todayCount = dayMap.get(todayStr) ?? 0;

  // Determine streak anchor (today if contributed, else yesterday)
  const anchor = todayCount > 0 ? todayStr : yesterdayStr;
  const anchorCount = dayMap.get(anchor) ?? 0;

  // ── Current streak ───────────────────────────────────────────────────────
  let currentStreak = 0;
  let currentStreakStart: string | null = null;
  let currentStreakEnd: string | null = null;

  if (anchorCount > 0) {
    let checkDate = new Date(anchor);
    for (let i = 0; i < 400; i++) { // guard against infinite loop
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
  const sortedDates = [...dayMap.keys()].sort(); // ascending

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
    todayContributions: todayCount,
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
  // Resolve account age
  const ageResult = await graphql.query<AccountAgeResult>(CREATED_AT_QUERY, { username });
  const accountCreatedAt = new Date(ageResult.user.createdAt);
  const startYear = accountCreatedAt.getFullYear();
  const currentYear = new Date().getFullYear();

  // Query at most 5 years to stay well within rate limits
  const yearsToQuery = Math.min(currentYear - startYear + 1, 5);
  const firstQueryYear = currentYear - yearsToQuery + 1;

  let lifetimeContributions = 0;
  let currentYearContributions = 0;
  let totalCommits = 0;
  let totalPRs = 0;
  let totalIssues = 0;
  let totalReviews = 0;
  const streakDays: ContributionDay[] = [];

  for (let year = firstQueryYear; year <= currentYear; year++) {
    const from = new Date(year, 0, 1).toISOString();
    const to =
      year === currentYear
        ? new Date().toISOString()
        : new Date(year, 11, 31, 23, 59, 59).toISOString();

    const result = await graphql.query<ContributionsResult>(CONTRIBUTIONS_QUERY, {
      username,
      from,
      to,
    });

    const col = result.user.contributionsCollection;
    const yearTotal = col.contributionCalendar.totalContributions;
    lifetimeContributions += yearTotal;

    if (year === currentYear) {
      currentYearContributions = yearTotal;
      totalCommits = col.totalCommitContributions;
      totalPRs = col.totalPullRequestContributions;
      totalIssues = col.totalIssueContributions;
      totalReviews = col.totalPullRequestReviewContributions;
      streakDays.push(...flattenDays(col));
    }

    // Carry over ALL days of the previous year for cross-year streak detection
    if (year === currentYear - 1) {
      streakDays.push(...flattenDays(col));
    }
  }

  const streak = computeStreak(streakDays);

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
