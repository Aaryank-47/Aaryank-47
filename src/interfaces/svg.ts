// ─── SVG Component Parameter Types ───────────────────────────────────────────

export interface CardOptions {
  width: number;
  height: number;
  title: string;
  accentColor?: string;
}

export interface TextOptions {
  x: number;
  y: number;
  content: string;
  fontSize?: number;
  fontWeight?: string | number;
  fill?: string;
  textAnchor?: 'start' | 'middle' | 'end';
  opacity?: number;
  letterSpacing?: number;
}

export interface ProgressBarOptions {
  x: number;
  y: number;
  totalWidth: number;
  filledWidth: number;
  height: number;
  fill: string;
  backgroundColor?: string;
  rx?: number;
  animationDelay?: number;
}

export interface StatGridItemOptions {
  cx: number;
  cy: number;
  label: string;
  value: string;
}

export interface RepoBadgeOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
  languageColor: string | null;
  updatedAt: string;
}
