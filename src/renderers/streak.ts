import type { StreakStats } from '../interfaces/stats.js';
import { createCard, text, verticalSep, CARD_WIDTH } from '../svg/components.js';
import { CARD_ACCENTS, COLORS } from '../constants/index.js';
import { theme } from '../svg/theme.js';
import { formatDate } from '../utils/format.js';

/**
 * Formats a day count as "X day" or "X days".
 */
function fmtDays(n: number): string {
  return `${n} ${n === 1 ? 'day' : 'days'}`;
}

/**
 * Renders the commit streak card.
 *
 * Layout (3 columns):
 *   Current Streak | Longest Streak | Today
 */
export function renderStreak(stats: StreakStats): string {
  const W = CARD_WIDTH;
  const H = 190;
  const P = theme.padding;
  const contentW = W - 2 * P;
  const colW = contentW / 3;

  const col0cx = P + colW * 0.5;
  const col1cx = P + colW * 1.5;
  const col2cx = P + colW * 2.5;

  const labelY  = theme.titleHeight + 30;
  const bigNumY = theme.titleHeight + 68;
  const subY    = theme.titleHeight + 88;
  const dateY   = theme.titleHeight + 106;

  function streakColumn(cx: number, label: string, count: number, start: string | null, end: string | null, color: string): string {
    const dateRange = (start && end && start !== end)
      ? `${formatDate(start)} - ${formatDate(end)}`
      : (start ? formatDate(start) : '—');

    return `<g>
      ${text({ x: cx, y: labelY, content: label, fontSize: theme.fontSize.sm, fill: theme.colors.textSecondary, textAnchor: 'middle' })}
      ${text({ x: cx, y: bigNumY, content: String(count), fontSize: theme.fontSize['4xl'], fontWeight: 700, fill: color, textAnchor: 'middle' })}
      ${text({ x: cx, y: subY, content: fmtDays(count), fontSize: theme.fontSize.sm, fill: theme.colors.textSecondary, textAnchor: 'middle' })}
      ${text({ x: cx, y: dateY, content: dateRange, fontSize: theme.fontSize.xs, fill: theme.colors.textMuted, textAnchor: 'middle' })}
    </g>`;
  }

  const todayLabel = theme.titleHeight + 30;
  const todayBig   = theme.titleHeight + 68;
  const todaySub   = theme.titleHeight + 88;

  const todayColumn = `<g>
    ${text({ x: col2cx, y: todayLabel, content: "Today", fontSize: theme.fontSize.sm, fill: theme.colors.textSecondary, textAnchor: 'middle' })}
    ${text({ x: col2cx, y: todayBig, content: String(stats.todayContributions), fontSize: theme.fontSize['4xl'], fontWeight: 700, fill: COLORS.green, textAnchor: 'middle' })}
    ${text({ x: col2cx, y: todaySub, content: 'contributions', fontSize: theme.fontSize.sm, fill: theme.colors.textSecondary, textAnchor: 'middle' })}
  </g>`;

  const content = [
    streakColumn(col0cx, 'Current Streak', stats.currentStreak, stats.currentStreakStart, stats.currentStreakEnd, COLORS.orange),
    streakColumn(col1cx, 'Longest Streak', stats.longestStreak, stats.longestStreakStart, stats.longestStreakEnd, COLORS.blueLight),
    todayColumn,
    verticalSep(P + colW,     theme.titleHeight + 10, H - 14),
    verticalSep(P + colW * 2, theme.titleHeight + 10, H - 14),
  ].join('\n');

  return createCard(
    { width: W, height: H, title: 'Commit Streak', accentColor: CARD_ACCENTS.streak },
    content
  );
}
