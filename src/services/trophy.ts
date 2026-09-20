import type { RepositoryStats, ContributionStats, StreakStats, TrophyItem, TrophyStats, TrophyRank } from '../interfaces/stats.js';
import { formatNumber } from '../utils/format.js';

interface TierDefinition {
  min: number;
  rank: TrophyRank;
  label: string;
  color: string;
}

const TIERS: TierDefinition[] = [
  { min: 0,    rank: 'C',   label: 'Bronze',    color: '#8b949e' },
  { min: 1,    rank: 'C',   label: 'Bronze',    color: '#cd7f32' },
  { min: 10,   rank: 'B',   label: 'Silver',    color: '#79c0ff' },
  { min: 50,   rank: 'A',   label: 'Gold',      color: '#d29922' },
  { min: 100,  rank: 'S',   label: 'Platinum',  color: '#bc8cff' },
  { min: 250,  rank: 'SS',  label: 'Diamond',   color: '#f778ba' },
  { min: 500,  rank: 'SSS', label: 'Legendary', color: '#39d353' },
];

function calculateRank(value: number, customThresholds?: Partial<Record<TrophyRank, number>>): { rank: TrophyRank; label: string; color: string } {
  const c = customThresholds?.C ?? 1;
  const b = customThresholds?.B ?? 10;
  const a = customThresholds?.A ?? 50;
  const s = customThresholds?.S ?? 100;
  const ss = customThresholds?.SS ?? 250;
  const sss = customThresholds?.SSS ?? 500;

  if (value >= sss) return { rank: 'SSS', label: 'Legendary', color: '#39d353' };
  if (value >= ss)  return { rank: 'SS',  label: 'Diamond',   color: '#f778ba' };
  if (value >= s)   return { rank: 'S',   label: 'Platinum',  color: '#bc8cff' };
  if (value >= a)   return { rank: 'A',   label: 'Gold',      color: '#d29922' };
  if (value >= b)   return { rank: 'B',   label: 'Silver',    color: '#79c0ff' };
  if (value >= c)   return { rank: 'C',   label: 'Bronze',    color: '#cd7f32' };
  return { rank: 'C', label: 'Bronze', color: '#8b949e' };
}

export function computeTrophyStats(
  repoStats: RepositoryStats,
  contributionStats: ContributionStats,
  streakStats: StreakStats
): TrophyStats {
  const definitions: Array<{ id: string; title: string; value: number; thresholds: Record<TrophyRank, number> }> = [
    {
      id: 'commits',
      title: 'Commits',
      value: contributionStats.totalCommits,
      thresholds: { C: 1, B: 100, A: 500, S: 1000, SS: 2500, SSS: 5000 },
    },
    {
      id: 'contributions',
      title: 'Contributions',
      value: contributionStats.lifetimeContributions,
      thresholds: { C: 10, B: 100, A: 500, S: 1000, SS: 2500, SSS: 5000 },
    },
    {
      id: 'stars',
      title: 'Stars',
      value: repoStats.totalStars,
      thresholds: { C: 1, B: 10, A: 50, S: 100, SS: 500, SSS: 1000 },
    },
    {
      id: 'followers',
      title: 'Followers',
      value: repoStats.followers,
      thresholds: { C: 1, B: 10, A: 50, S: 100, SS: 250, SSS: 500 },
    },
    {
      id: 'pull_requests',
      title: 'Pull Requests',
      value: contributionStats.totalPRs,
      thresholds: { C: 1, B: 10, A: 25, S: 50, SS: 100, SSS: 250 },
    },
    {
      id: 'issues',
      title: 'Issues',
      value: contributionStats.totalIssues,
      thresholds: { C: 1, B: 10, A: 25, S: 50, SS: 100, SSS: 250 },
    },
    {
      id: 'repositories',
      title: 'Repositories',
      value: repoStats.totalRepos,
      thresholds: { C: 1, B: 10, A: 25, S: 50, SS: 100, SSS: 200 },
    },
    {
      id: 'streak',
      title: 'Streak',
      value: streakStats.longestStreak,
      thresholds: { C: 3, B: 7, A: 14, S: 30, SS: 60, SSS: 100 },
    },
    {
      id: 'forks',
      title: 'Forks',
      value: repoStats.totalForks,
      thresholds: { C: 1, B: 5, A: 20, S: 50, SS: 100, SSS: 250 },
    },
  ];

  const trophies: TrophyItem[] = definitions.map((def) => {
    const { rank, label, color } = calculateRank(def.value, def.thresholds);
    return {
      id: def.id,
      title: def.title,
      rank,
      rankLabel: label,
      color,
      value: def.value,
      valueFormatted: formatNumber(def.value),
    };
  });

  return { trophies };
}
