import { COLORS, FONT_FAMILY, FONT_SIZE, BORDER_RADIUS, TITLE_HEIGHT } from '../constants/index.js';

/**
 * Centralised design tokens consumed by every SVG component.
 * Import only from this file inside the svg/ layer.
 */
export const theme = {
  colors: COLORS,
  fontFamily: FONT_FAMILY,
  fontSize: FONT_SIZE,
  borderRadius: BORDER_RADIUS,
  titleHeight: TITLE_HEIGHT,
  padding: 25,
  animationDuration: '0.8s',
  animationEasing: 'ease-out',
} as const;

export type Theme = typeof theme;
