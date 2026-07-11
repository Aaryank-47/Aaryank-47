// ─── API Endpoints ────────────────────────────────────────────────────────────

export const GITHUB_API_BASE = 'https://api.github.com' as const;
export const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql' as const;

// ─── Network / Retry ─────────────────────────────────────────────────────────

export const MAX_RETRIES = 3;
export const BASE_DELAY_MS = 1000;
export const MAX_REPOS_PER_PAGE = 100;

// ─── Card Geometry ────────────────────────────────────────────────────────────

export const CARD_WIDTH = 480;
export const CARD_PADDING = 25;
export const CARD_CONTENT_WIDTH = CARD_WIDTH - CARD_PADDING * 2; // 430
export const TITLE_HEIGHT = 52;
export const BORDER_RADIUS = 12;

// ─── GitHub Dark Theme Palette ────────────────────────────────────────────────

export const COLORS = {
  background: '#0d1117',
  backgroundSecondary: '#161b22',
  backgroundTertiary: '#21262d',
  border: '#30363d',
  borderSubtle: '#21262d',

  textPrimary: '#e6edf3',
  textSecondary: '#8b949e',
  textMuted: '#6e7681',

  blue: '#58a6ff',
  blueLight: '#79c0ff',
  green: '#3fb950',
  greenLight: '#56d364',
  orange: '#d29922',
  orangeLight: '#e3b341',
  red: '#f85149',
  purple: '#bc8cff',
  pink: '#f778ba',
  cyan: '#39d353',
  teal: '#1f6feb',
} as const;

// Per-card accent colours for the leading dot on the title
export const CARD_ACCENTS = {
  overview: COLORS.blue,
  languages: COLORS.purple,
  contributions: COLORS.green,
  streak: COLORS.orange,
  topRepositories: COLORS.blue,
  recentActivity: COLORS.pink,
  lastUpdated: COLORS.textMuted,
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────

export const FONT_FAMILY = "'Segoe UI', Ubuntu, 'Helvetica Neue', sans-serif";

export const FONT_SIZE = {
  xs: 9,
  sm: 11,
  base: 12,
  md: 13,
  lg: 14,
  xl: 16,
  '2xl': 18,
  '3xl': 24,
  '4xl': 32,
} as const;

// ─── Language Fallback Colours ────────────────────────────────────────────────

export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Rust: '#dea584',
  Go: '#00ADD8',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Dockerfile: '#384d54',
  'C#': '#239120',
  Scala: '#c22d40',
  Lua: '#000080',
  R: '#198CE7',
  MATLAB: '#e16737',
  Nix: '#7e7eff',
  Elixir: '#6e4a7e',
  Haskell: '#5e5086',
  Clojure: '#db5855',
  Erlang: '#B83998',
  OCaml: '#3be133',
  'F#': '#b845fc',
  Zig: '#ec915c',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  MDX: '#fcb32c',
  YAML: '#cb171e',
  JSON: '#8bc34a',
};

// ─── Event Type Labels ────────────────────────────────────────────────────────

export const EVENT_LABELS: Record<string, string> = {
  PushEvent: 'Pushed to',
  CreateEvent: 'Created',
  DeleteEvent: 'Deleted',
  ForkEvent: 'Forked',
  WatchEvent: 'Starred',
  PullRequestEvent: 'Pull request',
  IssuesEvent: 'Issue',
  IssueCommentEvent: 'Commented on',
  PullRequestReviewEvent: 'Reviewed PR in',
  ReleaseEvent: 'Released',
  PublicEvent: 'Made public',
  MemberEvent: 'Added member to',
};

// ─── Output Filenames ─────────────────────────────────────────────────────────

export const OUTPUT_FILES = {
  overview: 'github-overview.svg',
  languages: 'languages.svg',
  contributions: 'contributions.svg',
  streak: 'streak.svg',
  topRepositories: 'top-repositories.svg',
  recentActivity: 'recent-activity.svg',
  lastUpdated: 'last-updated.svg',
} as const;
