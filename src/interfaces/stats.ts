// ─── Processed & Aggregated Statistics ───────────────────────────────────────

export interface RepositorySummary {
  name: string;
  description: string | null;
  url: string;
  stars: number;
  forks: number;
  language: string | null;
  languageColor: string | null;
  updatedAt: string;
}

export interface RepositoryStats {
  totalRepos: number;
  totalStars: number;
  totalForks: number;
  totalIssues: number;
  totalSizeKb: number;
  followers: number;
  following: number;
  topRepositories: RepositorySummary[];
}

export interface LanguageStat {
  name: string;
  bytes: number;
  percentage: number;
  color: string;
}

export interface LanguageStats {
  languages: LanguageStat[];
  totalBytes: number;
}

export interface ContributionStats {
  currentYearContributions: number;
  lifetimeContributions: number;
  totalCommits: number;
  totalPRs: number;
  totalIssues: number;
  totalReviews: number;
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  todayContributions: number;
  currentStreakStart: string | null;
  currentStreakEnd: string | null;
  longestStreakStart: string | null;
  longestStreakEnd: string | null;
}

export interface ActivityItem {
  type: string;
  description: string;
  repo: string;
  repoUrl: string;
  date: string;
  url: string | null;
}

export interface RecentActivityStats {
  activities: ActivityItem[];
}

export type TrophyRank = 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS';

export interface TrophyItem {
  id: string;
  title: string;
  rank: TrophyRank;
  rankLabel: string;
  color: string;
  value: number;
  valueFormatted: string;
}

export interface TrophyStats {
  trophies: TrophyItem[];
}

export interface TopContributedRepoStats {
  name: string;
  owner: string;
  fullTitle: string;
  description: string | null;
  contributionCount: number;
  language: string | null;
  languageColor: string | null;
  stars: number;
  forks: number;
  updatedAt: string;
  url: string;
}

export interface AllStats {
  repository: RepositoryStats;
  language: LanguageStats;
  contribution: ContributionStats;
  streak: StreakStats;
  activity: RecentActivityStats;
  trophy: TrophyStats;
  topContributedRepo: TopContributedRepoStats | null;
  username: string;
  generatedAt: string;
}
