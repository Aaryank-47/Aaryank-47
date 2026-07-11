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

export interface AllStats {
  repository: RepositoryStats;
  language: LanguageStats;
  contribution: ContributionStats;
  streak: StreakStats;
  activity: RecentActivityStats;
  username: string;
  generatedAt: string;
}
