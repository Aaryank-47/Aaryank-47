/**
 * Entry point — orchestrates the entire stats generation pipeline.
 *
 * Flow:
 *   1. Load config (env validation happens here; fails fast on bad config)
 *   2. Instantiate API clients & load persistent snapshot
 *   3. Discover all accessible repositories & detect technology stack (incremental)
 *   4. Fetch statistics, contribution history, and activity
 *   5. Compute trends & save updated snapshot to data/snapshot.json
 *   6. Render all SVG cards in parallel
 *   7. Write all SVG files to assets/
 */

import { config } from './config/github.js';
import { GitHubRestClient } from './api/rest.js';
import { GitHubGraphQLClient } from './api/graphql.js';
import { fetchRepositoryStats } from './services/repository.js';
import { computeLanguageStats } from './services/language.js';
import { fetchContributionStats } from './services/contribution.js';
import { fetchRecentActivity } from './services/activity.js';
import { computeTrophyStats } from './services/trophy.js';
import { fetchTopContributedRepo } from './services/topContributedRepo.js';
import { discoverAllRepositories } from './services/repositoryScanner.js';
import { detectRepositoryTechnologies } from './services/technologyDetector.js';
import { loadProfileSnapshot, saveProfileSnapshot, computeTrends } from './services/profileSnapshot.js';
import { renderOverview } from './renderers/overview.js';
import { renderLanguages } from './renderers/languages.js';
import { renderContributions } from './renderers/contributions.js';
import { renderStreak } from './renderers/streak.js';
import { renderTopRepositories } from './renderers/topRepositories.js';
import { renderRecentActivity } from './renderers/recentActivity.js';
import { renderTrophies } from './renderers/trophies.js';
import { renderTopContributedRepo } from './renderers/topContributedRepo.js';
import { renderLastUpdated } from './renderers/lastUpdated.js';
import { writeOutput, ensureDir } from './utils/file.js';
import { OUTPUT_FILES } from './constants/index.js';

async function main(): Promise<void> {
  const startMs = Date.now();
  const generatedAt = new Date().toISOString();

  console.log(`\n🚀 GitHub Profile Stats Generator`);
  console.log(`   User:   ${config.username}`);
  console.log(`   Output: ${config.outputDir}/\n`);

  await ensureDir(config.outputDir);

  // ── API Clients & Snapshot Loading ──────────────────────────────────────────
  const rest = new GitHubRestClient(config);
  const graphql = new GitHubGraphQLClient(config);

  console.log('📦 Loading persistent snapshot...');
  const previousSnapshot = await loadProfileSnapshot();
  const prevFingerprints = previousSnapshot?.repositoryFingerprints || {};

  // ── Data Fetching ──────────────────────────────────────────────────────────
  console.log('📡 Fetching data from GitHub API...');

  const [discoveredRepos, repoResult, contributionResult, activityResult, topContributedRepo] =
    await Promise.all([
      discoverAllRepositories(graphql, config.username).then((repos) => {
        console.log(`  ✓ Discovered ${repos.length} accessible repositories`);
        return repos;
      }),
      fetchRepositoryStats(graphql, config.username).then((r) => {
        console.log(`  ✓ Fetched ${r.stats.totalRepos} owned repositories`);
        return r;
      }),
      fetchContributionStats(graphql, config.username).then((r) => {
        console.log(`  ✓ Fetched contribution history`);
        return r;
      }),
      fetchRecentActivity(rest, config.username).then((r) => {
        console.log(`  ✓ Fetched ${r.activities.length} recent activities`);
        return r;
      }),
      fetchTopContributedRepo(graphql, config.username).then((r) => {
        if (r) {
          console.log(`  ✓ Fetched top contributed repo: ${r.fullTitle} (${r.contributionCount} contribs)`);
        } else {
          console.log(`  ✓ Fetched top contributed repo: none found`);
        }
        return r;
      }),
    ]);

  // ── Technology Detection (Incremental) ──────────────────────────────────────
  console.log('🔍 Scanning public repositories for technology stack...');
  const { breakdown: techBreakdown, fingerprints } = await detectRepositoryTechnologies(
    rest,
    discoveredRepos,
    prevFingerprints
  );
  console.log(`  ✓ Detected ${techBreakdown.totalTechnologies} technologies across categories`);

  const repositoryStats = repoResult.stats;
  const languageStats = computeLanguageStats(repoResult.repositories);
  console.log(`  ✓ Computed language breakdown (${languageStats.languages.length} languages)`);

  const { contribution: contributionStats, streak: streakStats } = contributionResult;
  const trophyStats = computeTrophyStats(repositoryStats, contributionStats, streakStats);
  console.log(`  ✓ Computed trophy achievements (${trophyStats.trophies.length} trophies)`);

  // ── Snapshot & Trends Computation ──────────────────────────────────────────
  const currentKpis = {
    totalRepos: repositoryStats.totalRepos,
    totalStars: repositoryStats.totalStars,
    totalForks: repositoryStats.totalForks,
    totalContributions: contributionStats.lifetimeContributions,
    currentStreak: streakStats.currentStreak,
  };

  const trends = computeTrends(previousSnapshot, currentKpis, techBreakdown);
  if (trends.newTechnologies.length > 0) {
    console.log(`  ✨ Newly introduced technologies: ${trends.newTechnologies.join(', ')}`);
  }

  await saveProfileSnapshot(config.username, currentKpis, fingerprints, techBreakdown);

  // ── SVG Rendering ──────────────────────────────────────────────────────────
  console.log('\n🎨 Rendering SVG cards...');

  const svgCards: Array<{ file: string; svg: string }> = [
    { file: OUTPUT_FILES.overview,            svg: renderOverview(repositoryStats) },
    { file: OUTPUT_FILES.languages,           svg: renderLanguages(languageStats) },
    { file: OUTPUT_FILES.contributions,       svg: renderContributions(contributionStats) },
    { file: OUTPUT_FILES.streak,              svg: renderStreak(streakStats) },
    { file: OUTPUT_FILES.topRepositories,     svg: renderTopRepositories(repositoryStats) },
    { file: OUTPUT_FILES.recentActivity,      svg: renderRecentActivity(activityResult) },
    { file: OUTPUT_FILES.trophies,            svg: renderTrophies(trophyStats) },
    { file: OUTPUT_FILES.topContributedRepo,  svg: renderTopContributedRepo(topContributedRepo) },
    { file: OUTPUT_FILES.lastUpdated,         svg: renderLastUpdated(generatedAt) },
  ];

  // ── File Writing ───────────────────────────────────────────────────────────
  console.log('\n💾 Writing SVG files...');

  await Promise.all(
    svgCards.map(({ file, svg }) => writeOutput(config.outputDir, file, svg))
  );

  const elapsed = ((Date.now() - startMs) / 1000).toFixed(2);
  console.log(`\n✅ Done in ${elapsed}s — ${svgCards.length} SVG cards generated.\n`);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`\n❌ Fatal error: ${message}\n`);
  process.exitCode = 1;
});
