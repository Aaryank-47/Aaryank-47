import type { GraphQLRepository } from '../interfaces/github.js';
import type { LanguageStats, LanguageStat } from '../interfaces/stats.js';
import { LANGUAGE_COLORS } from '../constants/index.js';

/**
 * Aggregates language byte counts across all non-forked repositories,
 * then converts to percentages and returns the top 10.
 */
export function computeLanguageStats(repositories: GraphQLRepository[]): LanguageStats {
  const ownRepos = repositories.filter((r) => !r.isFork);

  // Accumulate bytes per language
  const byteMap = new Map<string, { bytes: number; color: string }>();

  for (const repo of ownRepos) {
    for (const edge of repo.languages.edges) {
      const { name, color } = edge.node;
      const resolvedColor =
        (color !== null && color !== '') ? color : (LANGUAGE_COLORS[name] ?? '#8b949e');

      const existing = byteMap.get(name);
      if (existing) {
        existing.bytes += edge.size;
      } else {
        byteMap.set(name, { bytes: edge.size, color: resolvedColor });
      }
    }
  }

  const totalBytes = Array.from(byteMap.values()).reduce((s, v) => s + v.bytes, 0);

  if (totalBytes === 0) {
    return { languages: [], totalBytes: 0 };
  }

  const languages: LanguageStat[] = Array.from(byteMap.entries())
    .map(([name, { bytes, color }]): LanguageStat => ({
      name,
      bytes,
      percentage: parseFloat(((bytes / totalBytes) * 100).toFixed(2)),
      color,
    }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 10);

  return { languages, totalBytes };
}
