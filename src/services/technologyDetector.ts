import type { GitHubRestClient } from '../api/rest.js';
import type { DiscoveredRepository } from '../interfaces/repository.js';
import type { RepositoryFingerprint } from '../interfaces/snapshot.js';
import type { DetectedTechnology, TechnologyCategory, TechStackBreakdown } from '../interfaces/technology.js';

interface TechRule {
  name: string;
  category: TechnologyCategory;
  matchPatterns: RegExp[];
}

const TECH_RULES: TechRule[] = [
  // Frontend
  { name: 'React', category: 'Frontend', matchPatterns: [/"react"/i, /"react-dom"/i] },
  { name: 'Next.js', category: 'Frontend', matchPatterns: [/"next"/i] },
  { name: 'React Native', category: 'Frontend', matchPatterns: [/"react-native"/i] },
  { name: 'Vue.js', category: 'Frontend', matchPatterns: [/"vue"/i] },
  { name: 'Svelte', category: 'Frontend', matchPatterns: [/"svelte"/i] },
  { name: 'Tailwind CSS', category: 'Frontend', matchPatterns: [/"tailwindcss"/i] },
  { name: 'Redux', category: 'Frontend', matchPatterns: [/"redux"/i, /"@reduxjs\/toolkit"/i] },
  { name: 'Vite', category: 'Frontend', matchPatterns: [/"vite"/i] },
  { name: 'Streamlit', category: 'Frontend', matchPatterns: [/streamlit/i] },
  { name: 'Chart.js', category: 'Frontend', matchPatterns: [/"chart\.js"/i] },

  // Backend
  { name: 'Node.js', category: 'Backend', matchPatterns: [/"express"/i, /"koa"/i, /"fastify"/i, /"@nestjs\/core"/i] },
  { name: 'Express.js', category: 'Backend', matchPatterns: [/"express"/i] },
  { name: 'FastAPI', category: 'Backend', matchPatterns: [/fastapi/i] },
  { name: 'Django', category: 'Backend', matchPatterns: [/django/i] },
  { name: 'Flask', category: 'Backend', matchPatterns: [/flask/i] },
  { name: 'BullMQ', category: 'Backend', matchPatterns: [/"bullmq"/i, /"bull"/i] },
  { name: 'JWT', category: 'Backend', matchPatterns: [/"jsonwebtoken"/i, /PyJWT/i] },
  { name: 'GraphQL', category: 'Backend', matchPatterns: [/"graphql"/i, /"apollo-server"/i] },

  // Databases & ORM
  { name: 'MongoDB', category: 'Databases', matchPatterns: [/"mongodb"/i, /"mongoose"/i, /pymongo/i] },
  { name: 'PostgreSQL', category: 'Databases', matchPatterns: [/"pg"/i, /psycopg/i, /postgres/i] },
  { name: 'MySQL', category: 'Databases', matchPatterns: [/"mysql2"/i, /mysqlconnector/i] },
  { name: 'Redis', category: 'Databases', matchPatterns: [/"redis"/i, /"ioredis"/i, /redis/i] },
  { name: 'Prisma', category: 'Databases', matchPatterns: [/"@prisma\/client"/i, /"prisma"/i] },
  { name: 'Mongoose', category: 'Databases', matchPatterns: [/"mongoose"/i] },

  // Infrastructure & DevOps
  { name: 'Docker', category: 'Infrastructure', matchPatterns: [/FROM /i, /docker-compose/i, /"docker"/i] },
  { name: 'GitHub Actions', category: 'Infrastructure', matchPatterns: [/uses: actions\//i] },
  { name: 'Vercel', category: 'Infrastructure', matchPatterns: [/"vercel"/i] },
  { name: 'Netlify', category: 'Infrastructure', matchPatterns: [/netlify/i] },
  { name: 'Render', category: 'Infrastructure', matchPatterns: [/render\.yaml/i] },

  // AI / ML
  { name: 'OpenAI', category: 'AI / ML', matchPatterns: [/"openai"/i, /openai/i] },
  { name: 'PyTorch', category: 'AI / ML', matchPatterns: [/torch/i] },
  { name: 'TensorFlow', category: 'AI / ML', matchPatterns: [/tensorflow/i] },
  { name: 'LangChain', category: 'AI / ML', matchPatterns: [/"langchain"/i, /langchain/i] },
  { name: 'NumPy', category: 'AI / ML', matchPatterns: [/numpy/i] },
  { name: 'Pandas', category: 'AI / ML', matchPatterns: [/pandas/i] },
  { name: 'Matplotlib', category: 'AI / ML', matchPatterns: [/matplotlib/i] },
  { name: 'Scikit-Learn', category: 'AI / ML', matchPatterns: [/scikit-learn/i, /sklearn/i] },

  // Tools & Platforms
  { name: 'Git', category: 'Tools & Platforms', matchPatterns: [/git/i] },
  { name: 'Postman', category: 'Tools & Platforms', matchPatterns: [/postman/i] },
  { name: 'Jest', category: 'Tools & Platforms', matchPatterns: [/"jest"/i] },
  { name: 'Vitest', category: 'Tools & Platforms', matchPatterns: [/"vitest"/i] },
  { name: 'ESLint', category: 'Tools & Platforms', matchPatterns: [/"eslint"/i] },
];

export async function detectRepositoryTechnologies(
  rest: GitHubRestClient,
  repositories: DiscoveredRepository[],
  previousFingerprints: Record<string, RepositoryFingerprint> = {}
): Promise<{
  breakdown: TechStackBreakdown;
  fingerprints: Record<string, RepositoryFingerprint>;
}> {
  const repoTechMap: Record<string, Set<string>> = {};
  const fingerprints: Record<string, RepositoryFingerprint> = {};

  const publicRepos = repositories.filter((r) => !r.isPrivate);

  for (const repo of publicRepos) {
    const title = repo.fullTitle;
    const prev = previousFingerprints[title];
    const techSet = new Set<string>();

    if (repo.primaryLanguage) {
      techSet.add(repo.primaryLanguage);
    }

    // Incremental scanning: if pushedAt unchanged, reuse previous scan!
    if (prev && prev.pushedAt === repo.pushedAt && Array.isArray(prev.technologies)) {
      for (const t of prev.technologies) techSet.add(t);
    } else {
      // Perform inspection of package files
      const manifestFiles = ['package.json', 'requirements.txt', 'pyproject.toml', 'Dockerfile', 'docker-compose.yml'];

      for (const file of manifestFiles) {
        try {
          const content = await rest.getRepoFileContent(repo.owner, repo.name, file);
          if (!content) continue;

          for (const rule of TECH_RULES) {
            if (rule.matchPatterns.some((pattern) => pattern.test(content))) {
              techSet.add(rule.name);
            }
          }
        } catch {
          // ignore individual file errors
        }
      }
    }

    repoTechMap[title] = techSet;
    fingerprints[title] = {
      id: repo.id,
      name: repo.name,
      pushedAt: repo.pushedAt,
      isPrivate: repo.isPrivate,
      technologies: Array.from(techSet),
    };
  }

  // Aggregate tech counts across all public repos
  const techRepoCountMap = new Map<string, { category: TechnologyCategory; repos: string[] }>();

  // Add default language rules for primary languages
  for (const repo of publicRepos) {
    if (repo.primaryLanguage) {
      const lang = repo.primaryLanguage;
      if (!techRepoCountMap.has(lang)) {
        techRepoCountMap.set(lang, { category: 'Languages', repos: [] });
      }
      const item = techRepoCountMap.get(lang)!;
      if (!item.repos.includes(repo.name)) item.repos.push(repo.name);
    }
  }

  // Add detected technologies
  for (const [repoTitle, techSet] of Object.entries(repoTechMap)) {
    const repoName = repoTitle.split('/')[1] ?? repoTitle;

    for (const techName of techSet) {
      const rule = TECH_RULES.find((r) => r.name.toLowerCase() === techName.toLowerCase());
      const category: TechnologyCategory = rule ? rule.category : 'Languages';

      if (!techRepoCountMap.has(techName)) {
        techRepoCountMap.set(techName, { category, repos: [] });
      }

      const item = techRepoCountMap.get(techName)!;
      if (!item.repos.includes(repoName)) {
        item.repos.push(repoName);
      }
    }
  }

  const categories: Record<TechnologyCategory, DetectedTechnology[]> = {
    Languages: [],
    Frontend: [],
    Backend: [],
    Databases: [],
    Infrastructure: [],
    'AI / ML': [],
    'Tools & Platforms': [],
  };

  for (const [name, { category, repos }] of techRepoCountMap.entries()) {
    const techItem: DetectedTechnology = {
      name,
      category,
      repoCount: repos.length,
      repos,
    };
    categories[category].push(techItem);
  }

  // Sort technologies by repoCount descending
  for (const cat of Object.keys(categories) as TechnologyCategory[]) {
    categories[cat].sort((a, b) => b.repoCount - a.repoCount);
  }

  const totalTechnologies = Array.from(techRepoCountMap.keys()).length;

  return {
    breakdown: {
      categories,
      totalTechnologies,
      newTechnologies: [],
    },
    fingerprints,
  };
}
