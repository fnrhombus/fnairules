export interface DetectedStack {
  name: string;
  description: string;
  language: string;
  framework: string;
  testing: string;
  buildTool: string;
  linting: string;
  packageManager: string;
}

const FRAMEWORK_MAP: Record<string, string> = {
  next: 'Next.js',
  nuxt: 'Nuxt',
  react: 'React',
  'react-dom': 'React',
  vue: 'Vue',
  '@angular/core': 'Angular',
  svelte: 'Svelte',
  express: 'Express',
  fastify: 'Fastify',
  hono: 'Hono',
  '@nestjs/core': 'NestJS',
  koa: 'Koa',
};

const TESTING_MAP: Record<string, string> = {
  vitest: 'vitest',
  jest: 'jest',
  mocha: 'mocha',
  '@jest/core': 'jest',
  cypress: 'cypress',
  playwright: 'playwright',
  '@playwright/test': 'playwright',
};

const BUILD_MAP: Record<string, string> = {
  vite: 'vite',
  webpack: 'webpack',
  esbuild: 'esbuild',
  tsup: 'tsup',
  rollup: 'rollup',
  turbo: 'turbopack',
  '@sveltejs/kit': 'vite',
};

const LINT_MAP: Record<string, string> = {
  eslint: 'eslint',
  prettier: 'prettier',
  '@biomejs/biome': 'biome',
  biome: 'biome',
};

function findFirst(allDeps: Record<string, string>, map: Record<string, string>): string {
  for (const [pkg, label] of Object.entries(map)) {
    if (pkg in allDeps) return label;
  }
  return '';
}

function findAllLinting(allDeps: Record<string, string>): string {
  const found: string[] = [];
  for (const [pkg, label] of Object.entries(LINT_MAP)) {
    if (pkg in allDeps && !found.includes(label)) {
      found.push(label);
    }
  }
  if (found.includes('eslint') && found.includes('prettier')) {
    return 'eslint+prettier';
  }
  return found[0] ?? '';
}

function detectPackageManager(raw: string): string {
  if (raw.includes('"packageManager"')) {
    const match = raw.match(/"packageManager"\s*:\s*"(pnpm|yarn|npm|bun)@/);
    if (match) return match[1];
  }
  return '';
}

export function detectFromPackageJson(raw: string): DetectedStack | null {
  try {
    const pkg = JSON.parse(raw);
    const deps: Record<string, string> = pkg.dependencies ?? {};
    const devDeps: Record<string, string> = pkg.devDependencies ?? {};
    const allDeps = { ...deps, ...devDeps };

    const hasTypescript = 'typescript' in allDeps;

    return {
      name: pkg.name ?? '',
      description: pkg.description ?? '',
      language: hasTypescript ? 'TypeScript' : 'JavaScript',
      framework: findFirst(allDeps, FRAMEWORK_MAP),
      testing: findFirst(allDeps, TESTING_MAP),
      buildTool: findFirst(allDeps, BUILD_MAP),
      linting: findAllLinting(allDeps),
      packageManager: detectPackageManager(raw),
    };
  } catch {
    return null;
  }
}

export function detectFromPyproject(raw: string): DetectedStack | null {
  try {
    const name = raw.match(/^name\s*=\s*"([^"]+)"/m)?.[1] ?? '';
    const desc = raw.match(/^description\s*=\s*"([^"]+)"/m)?.[1] ?? '';

    const depsMatch = raw.match(/\[project\.dependencies\]\s*\n([\s\S]*?)(?:\n\[|\n$)/);
    const depsBlock = raw.match(/dependencies\s*=\s*\[([\s\S]*?)\]/)?.[1] ?? '';
    const allText = (depsMatch?.[1] ?? '') + depsBlock + raw;

    const framework =
      allText.includes('fastapi') ? 'FastAPI' :
      allText.includes('django') ? 'Django' :
      allText.includes('flask') ? 'Flask' :
      '';

    const testing =
      allText.includes('pytest') ? 'pytest' :
      allText.includes('unittest') ? 'unittest' :
      '';

    const linting =
      allText.includes('ruff') ? 'ruff' :
      allText.includes('black') ? 'black' :
      '';

    const packageManager =
      allText.includes('[tool.poetry') ? 'poetry' :
      allText.includes('[tool.uv') || allText.includes('uv.lock') ? 'uv' :
      'pip';

    return {
      name,
      description: desc,
      language: 'Python',
      framework,
      testing,
      buildTool: '',
      linting,
      packageManager,
    };
  } catch {
    return null;
  }
}

export function detect(raw: string): DetectedStack | null {
  const trimmed = raw.trim();
  if (trimmed.startsWith('{')) {
    return detectFromPackageJson(trimmed);
  }
  if (trimmed.includes('[project]') || trimmed.includes('[tool.')) {
    return detectFromPyproject(trimmed);
  }
  // Try JSON anyway
  return detectFromPackageJson(trimmed);
}
