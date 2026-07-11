import type { RepositoryStats } from '../interfaces/stats.js';
import { createCard, statGridItem, verticalSep, horizontalSep, CARD_WIDTH } from '../svg/components.js';
import { formatNumber } from '../utils/format.js';
import { CARD_ACCENTS } from '../constants/index.js';
import { theme } from '../svg/theme.js';

/**
 * Renders the GitHub overview card.
 *
 * Layout:
 *   Row 1:  Repos | Stars | Forks
 *   Row 2:  Issues | Followers | Following
 */
export function renderOverview(stats: RepositoryStats): string {
  const W = CARD_WIDTH;  // 480
  const H = 190;
  const P = theme.padding; // 25
  const contentW = W - 2 * P; // 430
  const colW = contentW / 3;  // ~143

  // Column centers
  const col0cx = P + colW * 0.5;
  const col1cx = P + colW * 1.5;
  const col2cx = P + colW * 2.5;

  // Row vertical centers (below title)
  const row0cy = theme.titleHeight + 50;
  const row1cy = theme.titleHeight + 118;

  // Horizontal separator between rows
  const rowSepY = theme.titleHeight + 84;

  const items = [
    statGridItem({ cx: col0cx, cy: row0cy, label: 'Repositories', value: formatNumber(stats.totalRepos) }),
    statGridItem({ cx: col1cx, cy: row0cy, label: 'Total Stars',   value: formatNumber(stats.totalStars) }),
    statGridItem({ cx: col2cx, cy: row0cy, label: 'Total Forks',   value: formatNumber(stats.totalForks) }),
    statGridItem({ cx: col0cx, cy: row1cy, label: 'Open Issues',   value: formatNumber(stats.totalIssues) }),
    statGridItem({ cx: col1cx, cy: row1cy, label: 'Followers',      value: formatNumber(stats.followers) }),
    statGridItem({ cx: col2cx, cy: row1cy, label: 'Following',      value: formatNumber(stats.following) }),
  ].join('\n');

  const separators = [
    verticalSep(P + colW,     theme.titleHeight + 10, H - 14),
    verticalSep(P + colW * 2, theme.titleHeight + 10, H - 14),
    horizontalSep(P, W - P, rowSepY),
  ].join('\n');

  return createCard(
    { width: W, height: H, title: 'GitHub Overview', accentColor: CARD_ACCENTS.overview },
    items + separators
  );
}
