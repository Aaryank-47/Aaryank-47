export type TechnologyCategory =
  | 'Languages'
  | 'Frontend'
  | 'Backend'
  | 'Databases'
  | 'Infrastructure'
  | 'AI / ML'
  | 'Tools & Platforms';

export interface DetectedTechnology {
  name: string;
  category: TechnologyCategory;
  repoCount: number;
  repos: string[];
  isNew?: boolean;
  adoptionExpanded?: boolean;
  iconName?: string;
}

export interface TechnologyEvidence {
  technologyName: string;
  category: TechnologyCategory;
  repository: string;
  sourceFile: string;
  detectedAt: string;
}

export interface TechStackBreakdown {
  categories: Record<TechnologyCategory, DetectedTechnology[]>;
  totalTechnologies: number;
  newTechnologies: string[];
}
