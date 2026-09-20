export interface RepositoryFingerprint {
  id: number;
  name: string;
  pushedAt: string;
  isPrivate: boolean;
  technologies: string[];
}

export interface TechnologySnapshot {
  name: string;
  category: string;
  repoCount: number;
  lastDetected: string;
}

export interface KPISnapshot {
  totalRepos: number;
  totalStars: number;
  totalForks: number;
  totalContributions: number;
  currentStreak: number;
}

export interface ProfileSnapshot {
  lastScanAt: string;
  username: string;
  kpis: KPISnapshot;
  repositoryFingerprints: Record<string, RepositoryFingerprint>;
  technologies: Record<string, TechnologySnapshot>;
}
