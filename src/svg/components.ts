import { theme } from './theme.js';
import { escapeSvg, truncate, formatRelativeTime } from '../utils/format.js';
import type { CardOptions, TextOptions, ProgressBarOptions, StatGridItemOptions, RepoBadgeOptions } from '../interfaces/svg.js';
import { CARD_WIDTH, COLORS } from '../constants/index.js';

// ─── Base card wrapper ────────────────────────────────────────────────────────

/**
 * Wraps SVG content in a styled dark-theme card with header, title, and divider.
 * Every renderer calls this to produce the outer card shell.
 */
export function createCard(options: CardOptions, content: string): string {
  const { width, height, title, accentColor = COLORS.blue } = options;
  const { padding, titleHeight, borderRadius, fontFamily, fontSize, colors, animationDuration } = theme;
  const dotR = 5;
  const dotCX = padding;
  const dotCY = Math.round(titleHeight / 2);
  const titleX = padding + dotR * 2 + 6;

  return `<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${width}"
  height="${height}"
  viewBox="0 0 ${width} ${height}"
  role="img"
  aria-label="${escapeSvg(title)}"
>
  <title>${escapeSvg(title)}</title>

  <style>
    * { font-family: ${fontFamily}; }
    .title  { font-size: ${fontSize['2xl']}px; font-weight: 700; fill: ${colors.textPrimary}; }
    .label  { font-size: ${fontSize.sm}px; fill: ${colors.textSecondary}; }
    .value  { font-size: ${fontSize.md}px; font-weight: 700; fill: ${colors.textPrimary}; }
    .muted  { fill: ${colors.textMuted}; }
    .secondary { fill: ${colors.textSecondary}; }
    .animate-bar {
      transform-box: fill-box;
      transform-origin: left;
      animation: barGrow ${animationDuration} ease-out both;
    }
    @keyframes barGrow {
      from { transform: scaleX(0); }
      to   { transform: scaleX(1); }
    }
  </style>

  <!-- Card background -->
  <rect width="${width}" height="${height}" rx="${borderRadius}" fill="${colors.background}" stroke="${colors.borderSubtle}" stroke-width="1"/>

  <!-- Header background -->
  <rect x="1" y="1" width="${width - 2}" height="${titleHeight + 1}" rx="${borderRadius}" fill="${colors.backgroundSecondary}"/>
  <!-- Square off bottom corners of header -->
  <rect x="1" y="${titleHeight - 8}" width="${width - 2}" height="9" fill="${colors.backgroundSecondary}"/>

  <!-- Title accent dot -->
  <circle cx="${dotCX}" cy="${dotCY}" r="${dotR}" fill="${accentColor}"/>

  <!-- Title text -->
  <text class="title" x="${titleX}" y="${dotCY + 6}">${escapeSvg(title)}</text>

  <!-- Divider -->
  <line x1="${padding}" y1="${titleHeight}" x2="${width - padding}" y2="${titleHeight}" stroke="${colors.border}" stroke-width="1"/>

  ${content}
</svg>`;
}

// ─── Text ─────────────────────────────────────────────────────────────────────

export function text(options: TextOptions): string {
  const {
    x, y, content,
    fontSize = theme.fontSize.base,
    fontWeight = 'normal',
    fill = theme.colors.textPrimary,
    textAnchor = 'start',
    opacity = 1,
    letterSpacing,
  } = options;

  const spacing = letterSpacing !== undefined ? ` letter-spacing="${letterSpacing}"` : '';

  return `<text x="${x}" y="${y}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${fill}" text-anchor="${textAnchor}" opacity="${opacity}"${spacing}>${escapeSvg(content)}</text>`;
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

export function progressBar(options: ProgressBarOptions): string {
  const {
    x, y, totalWidth, filledWidth, height,
    fill,
    backgroundColor = theme.colors.backgroundTertiary,
    rx = 3,
    animationDelay = 0,
  } = options;

  const fw = Math.max(0, Math.min(filledWidth, totalWidth));

  return `<g>
    <rect x="${x}" y="${y}" width="${totalWidth}" height="${height}" rx="${rx}" fill="${backgroundColor}"/>
    <rect class="animate-bar" x="${x}" y="${y}" width="${fw}" height="${height}" rx="${rx}" fill="${fill}" style="animation-delay:${animationDelay}s"/>
  </g>`;
}

// ─── Stat grid item (label above value, centered) ────────────────────────────

export function statGridItem(options: StatGridItemOptions): string {
  const { cx, cy, label, value } = options;
  return `<g>
    ${text({ x: cx, y: cy - 14, content: label, fontSize: theme.fontSize.sm, fill: theme.colors.textSecondary, textAnchor: 'middle' })}
    ${text({ x: cx, y: cy + 10, content: value, fontSize: theme.fontSize['3xl'], fontWeight: 700, fill: theme.colors.textPrimary, textAnchor: 'middle' })}
  </g>`;
}

// ─── Vertical separator ───────────────────────────────────────────────────────

export function verticalSep(x: number, y1: number, y2: number): string {
  return `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="${theme.colors.border}" stroke-width="1" opacity="0.6"/>`;
}

// ─── Horizontal separator ─────────────────────────────────────────────────────

export function horizontalSep(x1: number, x2: number, y: number): string {
  return `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${theme.colors.border}" stroke-width="1" opacity="0.6"/>`;
}

// ─── Language dot ─────────────────────────────────────────────────────────────

export function langDot(cx: number, cy: number, color: string, r = 5): string {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${escapeSvg(color)}"/>`;
}

// ─── Repository badge ─────────────────────────────────────────────────────────

export function repoBadge(options: RepoBadgeOptions): string {
  const { x, y, width, height, name, description, stars, forks, language, languageColor, updatedAt } = options;
  const p = 14;
  const nameY = y + 20;
  const descY = y + 37;
  const metaY = y + height - 10;
  const available = width - 2 * p;

  const starsStr = stars > 0 ? `\u2605 ${stars.toLocaleString()}` : '';
  const forksStr = forks > 0 ? `\u2442 ${forks.toLocaleString()}` : '';
  const langStr = language ?? '';
  const updated = formatRelativeTime(updatedAt);

  const langDotEl = (languageColor && language)
    ? `<circle cx="${x + p}" cy="${metaY - 3}" r="4" fill="${escapeSvg(languageColor)}"/>`
    : '';
  const langTextEl = language
    ? text({ x: x + p + 10, y: metaY, content: langStr, fontSize: theme.fontSize.sm, fill: theme.colors.textSecondary })
    : '';
  const langWidth = language ? (langStr.length * 7 + 18) : 0;

  const descText = description ? truncate(description, 58) : '';

  // Right-aligned stars and forks
  const starsX = x + width - p;
  const forksX = x + width - p - (starsStr.length > 0 ? starsStr.length * 7 + 10 : 0);

  return `<g>
    <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="8" fill="${theme.colors.backgroundSecondary}" stroke="${theme.colors.border}" stroke-width="1"/>
    ${text({ x: x + p, y: nameY, content: truncate(name, 35), fontSize: theme.fontSize.md, fontWeight: 700, fill: theme.colors.textPrimary })}
    ${starsStr ? text({ x: starsX, y: nameY, content: starsStr, fontSize: theme.fontSize.sm, fill: theme.colors.orange, textAnchor: 'end' }) : ''}
    ${descText ? text({ x: x + p, y: descY, content: descText, fontSize: theme.fontSize.sm, fill: theme.colors.textSecondary }) : ''}
    ${langDotEl}${langTextEl}
    ${text({ x: x + p + langWidth + 10, y: metaY, content: forksStr, fontSize: theme.fontSize.sm, fill: theme.colors.textMuted })}
    ${text({ x: x + width - p, y: metaY, content: updated, fontSize: theme.fontSize.sm, fill: theme.colors.textMuted, textAnchor: 'end' })}
  </g>`;
}

// ─── Activity row ─────────────────────────────────────────────────────────────

const ACTIVITY_SYMBOLS: Record<string, string> = {
  push: '\u2B06',    // ⬆
  pr: '\u21B5',      // ↵
  issue: '\u25CE',   // ◎
  star: '\u2605',    // ★
  fork: '\u23CE',    // ⏎ (generic branch icon)
  release: '\u25C6', // ◆
  create: '\u271A',  // ✚
  review: '\u270E',  // ✎
  other: '\u25CF',   // ●
};

const ACTIVITY_COLORS: Record<string, string> = {
  push: COLORS.blue,
  pr: COLORS.purple,
  issue: COLORS.green,
  star: COLORS.orange,
  fork: COLORS.teal,
  release: COLORS.pink,
  create: COLORS.cyan,
  review: COLORS.blueLight,
  other: COLORS.textMuted,
};

export function activityRow(
  x: number,
  y: number,
  totalWidth: number,
  type: string,
  description: string,
  repo: string,
  date: string
): string {
  const symbol = ACTIVITY_SYMBOLS[type] ?? ACTIVITY_SYMBOLS['other'] ?? '\u25CF';
  const color = ACTIVITY_COLORS[type] ?? COLORS.textMuted;
  const symbolX = x + 10;
  const descX = x + 26;
  const available = totalWidth - 30;
  const desc = truncate(description, 60);
  const repoText = truncate(repo, 35);

  return `<g>
    <text x="${symbolX}" y="${y + 1}" font-size="13" fill="${escapeSvg(color)}" text-anchor="middle">${symbol}</text>
    ${text({ x: descX, y, content: desc, fontSize: theme.fontSize.base, fill: theme.colors.textPrimary })}
    ${text({ x: descX, y: y + 16, content: repoText, fontSize: theme.fontSize.xs, fill: theme.colors.textMuted })}
    ${text({ x: x + totalWidth, y: y + 16, content: date, fontSize: theme.fontSize.xs, fill: theme.colors.textMuted, textAnchor: 'end' })}
  </g>`;
}

export { CARD_WIDTH };
