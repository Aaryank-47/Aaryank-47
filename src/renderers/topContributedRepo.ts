import type { TopContributedRepoStats } from '../interfaces/stats.js';
import { createCard, text, CARD_WIDTH } from '../svg/components.js';
import { CARD_ACCENTS, COLORS } from '../constants/index.js';
import { theme } from '../svg/theme.js';
import { formatRelativeTime, truncate, escapeSvg, formatNumber } from '../utils/format.js';

export function renderTopContributedRepo(stats: TopContributedRepoStats | null): string {
  const W = CARD_WIDTH;
  const H = 165;
  const P = theme.padding;
  const contentW = W - 2 * P;

  if (!stats) {
    const fallbackContent = text({
      x: W / 2,
      y: theme.titleHeight + 60,
      content: 'No repository contribution data available',
      fontSize: theme.fontSize.base,
      fill: theme.colors.textMuted,
      textAnchor: 'middle',
    });
    return createCard(
      { width: W, height: H, title: 'Top Contributed Repository', accentColor: CARD_ACCENTS.topContributedRepo },
      fallbackContent
    );
  }

  const repoCardY = theme.titleHeight + 14;
  const repoCardH = H - theme.titleHeight - 24;

  const ownerRepoTitle = `${stats.owner}/${stats.name}`;
  const descText = stats.description ? truncate(stats.description, 58) : 'No description provided';
  const updatedText = formatRelativeTime(stats.updatedAt);
  const contribStr = `${formatNumber(stats.contributionCount)} contribs`;

  const nameY = repoCardY + 24;
  const descY = repoCardY + 46;
  const metaY = repoCardY + repoCardH - 14;

  const langDot = (stats.languageColor && stats.language)
    ? `<circle cx="${P + 14}" cy="${metaY - 3}" r="4" fill="${escapeSvg(stats.languageColor)}"/>`
    : '';
  const langText = stats.language
    ? text({ x: P + 24, y: metaY, content: stats.language, fontSize: theme.fontSize.sm, fill: theme.colors.textSecondary })
    : '';
  const langOffset = stats.language ? (stats.language.length * 7 + 28) : 14;

  const starsStr = stats.stars > 0 ? `\u2605 ${formatNumber(stats.stars)}` : '';
  const forksStr = stats.forks > 0 ? `\u2442 ${formatNumber(stats.forks)}` : '';

  const starsText = starsStr
    ? text({ x: P + langOffset, y: metaY, content: starsStr, fontSize: theme.fontSize.sm, fill: theme.colors.orange })
    : '';
  const starsOffset = starsStr ? (starsStr.length * 7 + 14) : 0;

  const forksText = forksStr
    ? text({ x: P + langOffset + starsOffset, y: metaY, content: forksStr, fontSize: theme.fontSize.sm, fill: theme.colors.textMuted })
    : '';

  return createCard(
    { width: W, height: H, title: 'Top Contributed Repository', accentColor: CARD_ACCENTS.topContributedRepo },
    `<g>
      <!-- Repository Card container -->
      <rect x="${P}" y="${repoCardY}" width="${contentW}" height="${repoCardH}" rx="8" fill="${theme.colors.backgroundSecondary}" stroke="${theme.colors.border}" stroke-width="1"/>

      <!-- Repo Title -->
      ${text({ x: P + 14, y: nameY, content: truncate(ownerRepoTitle, 30), fontSize: theme.fontSize.lg, fontWeight: 700, fill: theme.colors.blue })}

      <!-- Contribution Count Badge -->
      <rect x="${P + contentW - 135}" y="${repoCardY + 10}" width="121" height="22" rx="11" fill="${COLORS.cyan}" opacity="0.15"/>
      ${text({ x: P + contentW - 75, y: repoCardY + 25, content: `⚡ ${contribStr}`, fontSize: theme.fontSize.xs + 1, fontWeight: 700, fill: COLORS.cyan, textAnchor: 'middle' })}

      <!-- Description -->
      ${text({ x: P + 14, y: descY, content: descText, fontSize: theme.fontSize.sm, fill: theme.colors.textSecondary })}

      <!-- Meta Info -->
      ${langDot}
      ${langText}
      ${starsText}
      ${forksText}
      ${text({ x: P + contentW - 14, y: metaY, content: updatedText, fontSize: theme.fontSize.sm, fill: theme.colors.textMuted, textAnchor: 'end' })}
    </g>`
  );
}
