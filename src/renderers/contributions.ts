import type { ContributionStats } from '../interfaces/stats.js';
import { createCard, statGridItem, verticalSep, horizontalSep, text, CARD_WIDTH } from '../svg/components.js';
import { formatNumber } from '../utils/format.js';
import { CARD_ACCENTS } from '../constants/index.js';
import { theme } from '../svg/theme.js';

/**
 * Renders the contributions card.
 *
 * Layout (2 rows × 3 columns):
 *   Row 1: This Year | Lifetime | Commits
 *   Row 2: Pull Requests | Issues | Reviews
 */
export function renderContributions(stats: ContributionStats): string {
  const W = CARD_WIDTH;
  const H = 200;
  const P = theme.padding;
  const contentW = W - 2 * P;
  const colW = contentW / 3;

  const col0cx = P + colW * 0.5;
  const col1cx = P + colW * 1.5;
  const col2cx = P + colW * 2.5;

  const row0cy = theme.titleHeight + 50;
  const row1cy = theme.titleHeight + 120;
  const rowSepY = theme.titleHeight + 86;

  const items = [
    statGridItem({ cx: col0cx, cy: row0cy, label: 'This Year',    value: formatNumber(stats.currentYearContributions) }),
    statGridItem({ cx: col1cx, cy: row0cy, label: 'Lifetime',     value: formatNumber(stats.lifetimeContributions) }),
    statGridItem({ cx: col2cx, cy: row0cy, label: 'Commits',      value: formatNumber(stats.totalCommits) }),
    statGridItem({ cx: col0cx, cy: row1cy, label: 'Pull Requests', value: formatNumber(stats.totalPRs) }),
    statGridItem({ cx: col1cx, cy: row1cy, label: 'Issues',        value: formatNumber(stats.totalIssues) }),
    statGridItem({ cx: col2cx, cy: row1cy, label: 'Reviews',       value: formatNumber(stats.totalReviews) }),
  ].join('\n');

  const separators = [
    verticalSep(P + colW,     theme.titleHeight + 10, H - 14),
    verticalSep(P + colW * 2, theme.titleHeight + 10, H - 14),
    horizontalSep(P, W - P, rowSepY),
  ].join('\n');

  return createCard(
    { width: W, height: H, title: 'Contributions', accentColor: CARD_ACCENTS.contributions },
    items + separators
  );
}
