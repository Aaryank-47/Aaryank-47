import type { TrophyStats, TrophyItem } from '../interfaces/stats.js';
import { createCard, text, CARD_WIDTH } from '../svg/components.js';
import { CARD_ACCENTS, COLORS } from '../constants/index.js';
import { theme } from '../svg/theme.js';
import { escapeSvg } from '../utils/format.js';

const COLS = 3;
const CELL_W = 136;
const CELL_H = 62;
const GAP_X = 11;
const GAP_Y = 10;

function trophyIconSvg(color: string, x: number, y: number): string {
  // SVG trophy cup icon path
  return `<g transform="translate(${x}, ${y}) scale(0.85)">
    <path d="M12 2C8 2 5 3.5 5 7C5 10.5 7.5 13 10.5 13.8V16H8C7.4 16 7 16.4 7 17C7 17.6 7.4 18 8 18H16C16.6 18 17 17.6 17 17C17 16.4 16.6 16 16 16H13.5V13.8C16.5 13 19 10.5 19 7C19 3.5 16 2 12 2Z" fill="${escapeSvg(color)}"/>
    <path d="M4 6H2V8C2 9.7 3.3 11 5 11V9.2C4.4 8.7 4 7.9 4 7V6Z" fill="${escapeSvg(color)}" opacity="0.8"/>
    <path d="M20 6H22V7C22 7.9 21.6 8.7 21 9.2V11C22.7 11 24 9.7 24 8V6H20Z" fill="${escapeSvg(color)}" opacity="0.8"/>
  </g>`;
}

function renderTrophyCell(item: TrophyItem, x: number, y: number): string {
  const titleY = y + 18;
  const rankY = y + 36;
  const valueY = y + 51;

  return `<g>
    <!-- Cell background -->
    <rect x="${x}" y="${y}" width="${CELL_W}" height="${CELL_H}" rx="8" fill="${theme.colors.backgroundSecondary}" stroke="${theme.colors.border}" stroke-width="1"/>

    <!-- Trophy icon -->
    ${trophyIconSvg(item.color, x + 8, y + 8)}

    <!-- Title -->
    ${text({
      x: x + 34,
      y: titleY,
      content: item.title,
      fontSize: theme.fontSize.xs + 1,
      fontWeight: 700,
      fill: theme.colors.textPrimary,
    })}

    <!-- Rank badge pill -->
    <rect x="${x + CELL_W - 36}" y="${y + 8}" width="28" height="15" rx="4" fill="${escapeSvg(item.color)}" opacity="0.2"/>
    ${text({
      x: x + CELL_W - 22,
      y: y + 19,
      content: item.rank,
      fontSize: theme.fontSize.xs,
      fontWeight: 700,
      fill: escapeSvg(item.color),
      textAnchor: 'middle',
    })}

    <!-- Value & Rank label -->
    ${text({
      x: x + 34,
      y: valueY,
      content: `${item.valueFormatted}`,
      fontSize: theme.fontSize.sm,
      fontWeight: 700,
      fill: theme.colors.textSecondary,
    })}
    ${text({
      x: x + CELL_W - 8,
      y: valueY,
      content: item.rankLabel,
      fontSize: theme.fontSize.xs,
      fill: theme.colors.textMuted,
      textAnchor: 'end',
    })}
  </g>`;
}

export function renderTrophies(stats: TrophyStats): string {
  const W = CARD_WIDTH;
  const P = theme.padding;
  const trophies = stats.trophies;

  const rows = Math.ceil(trophies.length / COLS);
  const H = theme.titleHeight + 14 + rows * (CELL_H + GAP_Y);

  const cells = trophies.map((item, index) => {
    const col = index % COLS;
    const row = Math.floor(index / COLS);
    const x = P + col * (CELL_W + GAP_X);
    const y = theme.titleHeight + 14 + row * (CELL_H + GAP_Y);

    return renderTrophyCell(item, x, y);
  }).join('\n');

  return createCard(
    { width: W, height: H, title: 'GitHub Trophies', accentColor: CARD_ACCENTS.trophies },
    cells
  );
}
