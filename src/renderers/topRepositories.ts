import type { RepositoryStats } from '../interfaces/stats.js';
import { createCard, repoBadge, CARD_WIDTH } from '../svg/components.js';
import { CARD_ACCENTS } from '../constants/index.js';
import { theme } from '../svg/theme.js';

const BADGE_HEIGHT = 68;
const BADGE_GAP = 10;
const SHOW_COUNT = 4;

/**
 * Renders the top repositories card.
 * Displays up to 4 repos sorted by stars, each in a styled badge.
 */
export function renderTopRepositories(stats: RepositoryStats): string {
  const W = CARD_WIDTH;
  const P = theme.padding;
  const badgeW = W - 2 * P;
  const repos = stats.topRepositories.slice(0, SHOW_COUNT);
  const H = theme.titleHeight + 14 + repos.length * (BADGE_HEIGHT + BADGE_GAP) + 4;

  const badges = repos.map((repo, i) => {
    const y = theme.titleHeight + 14 + i * (BADGE_HEIGHT + BADGE_GAP);
    return repoBadge({
      x: P,
      y,
      width: badgeW,
      height: BADGE_HEIGHT,
      name: repo.name,
      description: repo.description,
      stars: repo.stars,
      forks: repo.forks,
      language: repo.language,
      languageColor: repo.languageColor,
      updatedAt: repo.updatedAt,
    });
  }).join('\n');

  return createCard(
    { width: W, height: H, title: 'Top Repositories', accentColor: CARD_ACCENTS.topRepositories },
    badges
  );
}
