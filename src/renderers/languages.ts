import type { LanguageStats } from '../interfaces/stats.js';
import { createCard, text, progressBar, langDot, CARD_WIDTH } from '../svg/components.js';
import { theme } from '../svg/theme.js';
import { CARD_ACCENTS } from '../constants/index.js';
import { escapeSvg } from '../utils/format.js';

const ROW_HEIGHT = 32;
const BAR_HEIGHT = 8;
const BAR_X_OFFSET = 170; // start of bar after language name

/**
 * Renders the top languages card with animated progress bars.
 * Shows up to 10 languages, each on its own row.
 */
export function renderLanguages(stats: LanguageStats): string {
  const W = CARD_WIDTH; // 480
  const P = theme.padding; // 25
  const contentW = W - 2 * P; // 430
  const langCount = Math.min(stats.languages.length, 10);
  const H = theme.titleHeight + 20 + langCount * ROW_HEIGHT + 18;

  if (langCount === 0) {
    const noData = text({
      x: W / 2, y: theme.titleHeight + 50,
      content: 'No language data available.',
      fontSize: theme.fontSize.sm,
      fill: theme.colors.textMuted,
      textAnchor: 'middle',
    });
    return createCard({ width: W, height: 120, title: 'Top Languages', accentColor: CARD_ACCENTS.languages }, noData);
  }

  const barTotalWidth = contentW - BAR_X_OFFSET - 55; // space for percentage label

  const rows = stats.languages.map((lang, i) => {
    const rowY = theme.titleHeight + 20 + i * ROW_HEIGHT;
    const dotCY = rowY + 10;
    const textY = rowY + 14;
    const barY = rowY + 5;
    const barFillW = (lang.percentage / 100) * barTotalWidth;

    return `<g>
      ${langDot(P + 6, dotCY, lang.color)}
      ${text({ x: P + 16, y: textY, content: lang.name, fontSize: theme.fontSize.sm, fontWeight: 600, fill: theme.colors.textPrimary })}
      ${progressBar({
        x: P + BAR_X_OFFSET,
        y: barY,
        totalWidth: barTotalWidth,
        filledWidth: barFillW,
        height: BAR_HEIGHT,
        fill: escapeSvg(lang.color),
        rx: 4,
        animationDelay: i * 0.08,
      })}
      ${text({
        x: P + BAR_X_OFFSET + barTotalWidth + 8,
        y: textY,
        content: `${lang.percentage.toFixed(1)}%`,
        fontSize: theme.fontSize.sm,
        fill: theme.colors.textSecondary,
      })}
    </g>`;
  }).join('\n');

  return createCard(
    { width: W, height: H, title: 'Top Languages', accentColor: CARD_ACCENTS.languages },
    rows
  );
}
