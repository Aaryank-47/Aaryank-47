export interface KPIMeta {
  value: number;
  source: string;
}

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
  longestStreak: number;
}

export interface ProfileSnapshot {
  schemaVersion: number;
  generatedAt: string;
  username: string;
  kpis: {
    totalRepos: KPIMeta;
    totalStars: KPIMeta;
    totalForks: KPIMeta;
    totalContributions: KPIMeta;
    currentStreak: KPIMeta;
    longestStreak: KPIMeta;
  };
  repositoryFingerprints: Record<string, RepositoryFingerprint>;
  technologies: Record<string, TechnologySnapshot>;
}
