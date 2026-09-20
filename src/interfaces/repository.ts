export interface DiscoveredRepository {
  id: number;
  name: string;
  owner: string;
  fullTitle: string;
  isPrivate: boolean;
  isFork: boolean;
  isOwner: boolean;
  stargazerCount: number;
  forkCount: number;
  pushedAt: string;
  updatedAt: string;
  primaryLanguage: string | null;
  description: string | null;
  url: string;
}
