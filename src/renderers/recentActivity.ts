import type { RecentActivityStats } from '../interfaces/stats.js';
import { createCard, activityRow, horizontalSep, CARD_WIDTH } from '../svg/components.js';
import { CARD_ACCENTS } from '../constants/index.js';
import { theme } from '../svg/theme.js';

const ROW_HEIGHT = 38;
const SHOW_COUNT = 6;

/**
 * Renders the recent activity card.
 * Shows up to 6 activities with type-based icons, description, repo, and relative time.
 */
export function renderRecentActivity(stats: RecentActivityStats): string {
  const W = CARD_WIDTH;
  const P = theme.padding;
  const activities = stats.activities.slice(0, SHOW_COUNT);
  const H = theme.titleHeight + 14 + activities.length * ROW_HEIGHT + 8;

  if (activities.length === 0) {
    return createCard(
      { width: W, height: 110, title: 'Recent Activity', accentColor: CARD_ACCENTS.recentActivity },
      `<text x="${W / 2}" y="${theme.titleHeight + 40}" font-size="11" fill="${theme.colors.textMuted}" text-anchor="middle">No recent public activity found.</text>`
    );
  }

  const rows: string[] = [];

  activities.forEach((activity, i) => {
    const rowY = theme.titleHeight + 28 + i * ROW_HEIGHT;

    rows.push(
      activityRow(
        P,
        rowY,
        W - 2 * P,
        activity.type,
        activity.description,
        activity.repo,
        activity.date
      )
    );

    // Add a subtle separator between rows (not after the last one)
    if (i < activities.length - 1) {
      rows.push(horizontalSep(P + 20, W - P, rowY + ROW_HEIGHT - 4));
    }
  });

  return createCard(
    { width: W, height: H, title: 'Recent Activity', accentColor: CARD_ACCENTS.recentActivity },
    rows.join('\n')
  );
}
