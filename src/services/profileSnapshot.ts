import * as fs from 'fs/promises';
import * as path from 'path';
import type { ProfileSnapshot, KPISnapshot, RepositoryFingerprint, TechnologySnapshot } from '../interfaces/snapshot.js';
import type { TechStackBreakdown } from '../interfaces/technology.js';

const SNAPSHOT_FILE_PATH = path.join(process.cwd(), 'data', 'snapshot.json');

export interface TrendDeltas {
  repoDelta: number;
  starDelta: number;
  forkDelta: number;
  contributionDelta: number;
  streakDelta: number;
  newTechnologies: string[];
}

export async function loadProfileSnapshot(): Promise<ProfileSnapshot | null> {
  try {
    const data = await fs.readFile(SNAPSHOT_FILE_PATH, 'utf-8');
    return JSON.parse(data) as ProfileSnapshot;
  } catch {
    return null;
  }
}

export async function saveProfileSnapshot(
  username: string,
  kpis: KPISnapshot,
  fingerprints: Record<string, RepositoryFingerprint>,
  techBreakdown: TechStackBreakdown
): Promise<void> {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    await fs.mkdir(dataDir, { recursive: true });

    const techSnapshotMap: Record<string, TechnologySnapshot> = {};

    for (const catList of Object.values(techBreakdown.categories)) {
      for (const item of catList) {
        techSnapshotMap[item.name] = {
          name: item.name,
          category: item.category,
          repoCount: item.repoCount,
          lastDetected: new Date().toISOString(),
        };
      }
    }

    const snapshot: ProfileSnapshot = {
      lastScanAt: new Date().toISOString(),
      username,
      kpis,
      repositoryFingerprints: fingerprints,
      technologies: techSnapshotMap,
    };

    await fs.writeFile(SNAPSHOT_FILE_PATH, JSON.stringify(snapshot, null, 2), 'utf-8');
    console.log(`  ✓ Updated persistent snapshot: data/snapshot.json`);
  } catch (err) {
    console.warn(`  [Snapshot] Warning: Failed to save snapshot:`, err);
  }
}

export function computeTrends(
  previousSnapshot: ProfileSnapshot | null,
  currentKpis: KPISnapshot,
  currentTech: TechStackBreakdown
): TrendDeltas {
  if (!previousSnapshot) {
    return {
      repoDelta: 0,
      starDelta: 0,
      forkDelta: 0,
      contributionDelta: 0,
      streakDelta: 0,
      newTechnologies: [],
    };
  }

  const prev = previousSnapshot.kpis;
  const prevTechKeys = new Set(Object.keys(previousSnapshot.technologies || {}));

  const currentTechKeys = new Set<string>();
  for (const catList of Object.values(currentTech.categories)) {
    for (const item of catList) {
      currentTechKeys.add(item.name);
    }
  }

  const newTechList: string[] = [];
  for (const tech of currentTechKeys) {
    if (!prevTechKeys.has(tech)) {
      newTechList.push(tech);
    }
  }

  return {
    repoDelta: currentKpis.totalRepos - (prev.totalRepos || 0),
    starDelta: currentKpis.totalStars - (prev.totalStars || 0),
    forkDelta: currentKpis.totalForks - (prev.totalForks || 0),
    contributionDelta: currentKpis.totalContributions - (prev.totalContributions || 0),
    streakDelta: currentKpis.currentStreak - (prev.currentStreak || 0),
    newTechnologies: newTechList,
  };
}
