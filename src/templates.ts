export interface ProjectConfig {
  // Step 1
  name: string;
  description: string;
  language: string;
  framework: string;
  testing: string;
  buildTool: string;
  linting: string;
  packageManager: string;
  // Step 2
  codeStyle: string;
  indentation: string;
  commitConvention: string;
  testConvention: string;
  namingConvention: string;
  errorHandling: string;
  customRules: string;
}

export type OutputFormat = 'claude' | 'cursorrules' | 'copilot' | 'windsurf' | 'agents';

export const FORMAT_LABELS: Record<OutputFormat, string> = {
  claude: 'CLAUDE.md',
  cursorrules: '.cursorrules',
  copilot: 'copilot-instructions.md',
  windsurf: '.windsurfrules',
  agents: 'AGENTS.md',
};

export const FORMAT_FILENAMES: Record<OutputFormat, string> = {
  claude: 'CLAUDE.md',
  cursorrules: '.cursorrules',
  copilot: 'copilot-instructions.md',
  windsurf: '.windsurfrules',
  agents: 'AGENTS.md',
};

function stackSummary(c: ProjectConfig): string {
  const parts = [c.language, c.framework, c.buildTool, c.testing, c.linting]
    .filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Not specified';
}

function buildCommands(c: ProjectConfig): string {
  const pm = c.packageManager || 'npm';
  const run = pm === 'npm' ? 'npm run' : pm;
  const install = pm === 'bun' ? 'bun install' : `${pm} install`;

  const lines = [`- Install: \`${install}\``];

  if (c.buildTool) {
    lines.push(`- Build: \`${run} build\``);
  }
  if (c.testing) {
    lines.push(`- Test: \`${run} test\``);
  }
  if (c.linting) {
    lines.push(`- Lint: \`${run} lint\``);
  }
  lines.push(`- Dev: \`${run} dev\``);

  return lines.join('\n');
}

function buildCommandsPython(c: ProjectConfig): string {
  const pm = c.packageManager || 'pip';
  const lines: string[] = [];

  if (pm === 'poetry') {
    lines.push('- Install: `poetry install`');
    lines.push('- Dev: `poetry run python -m <module>`');
  } else if (pm === 'uv') {
    lines.push('- Install: `uv sync`');
    lines.push('- Dev: `uv run python -m <module>`');
  } else {
    lines.push('- Install: `pip install -r requirements.txt`');
    lines.push('- Dev: `python -m <module>`');
  }

  if (c.testing === 'pytest') {
    lines.push(`- Test: \`${pm === 'poetry' ? 'poetry run ' : pm === 'uv' ? 'uv run ' : ''}pytest\``);
  }
  if (c.linting) {
    lines.push(`- Lint: \`${c.linting} check .\``);
  }

  return lines.join('\n');
}

function commandsSection(c: ProjectConfig): string {
  if (c.language === 'Python') return buildCommandsPython(c);
  if (c.language === 'Go') {
    const lines = ['- Build: `go build ./...`', '- Test: `go test ./...`'];
    if (c.linting) lines.push(`- Lint: \`${c.linting} ./...\``);
    return lines.join('\n');
  }
  if (c.language === 'Rust') {
    return '- Build: `cargo build`\n- Test: `cargo test`\n- Lint: `cargo clippy`';
  }
  return buildCommands(c);
}

function codeStyleSection(c: ProjectConfig): string {
  const lines: string[] = [];

  if (c.indentation) {
    lines.push(`- Indentation: ${c.indentation}`);
  }

  if (c.codeStyle === 'functional') {
    lines.push('- Prefer functional style: use `map`, `filter`, `reduce` over imperative loops');
    lines.push('- Favor immutability and pure functions where practical');
  } else if (c.codeStyle === 'oop') {
    lines.push('- Use object-oriented patterns: classes, interfaces, encapsulation');
    lines.push('- Apply SOLID principles');
  }

  if (c.namingConvention && c.namingConvention !== 'mixed') {
    lines.push(`- Naming: ${c.namingConvention}`);
  }

  if (c.errorHandling === 'exceptions') {
    lines.push('- Error handling: use try/catch with descriptive error messages');
  } else if (c.errorHandling === 'result') {
    lines.push('- Error handling: prefer Result/Either types over thrown exceptions');
  }

  if (c.linting) {
    const lintLabel = c.linting === 'eslint+prettier' ? 'ESLint + Prettier' : c.linting;
    lines.push(`- Always follow ${lintLabel} rules. Do not disable rules without justification.`);
  }

  return lines.join('\n');
}

function testingSection(c: ProjectConfig): string {
  if (!c.testing) return '- No testing framework configured.';

  const lines = [`- Testing framework: ${c.testing}`];

  if (c.testConvention === 'colocated') {
    lines.push('- Place test files next to the source files they test (e.g., `foo.test.ts` beside `foo.ts`)');
  } else if (c.testConvention === 'separate') {
    lines.push('- Place tests in a separate `tests/` or `__tests__/` directory');
  } else if (c.testConvention === 'both') {
    lines.push('- Unit tests: colocated next to source files');
    lines.push('- Integration/E2E tests: in a separate `tests/` directory');
  }

  lines.push('- Write tests for all new features and bug fixes');
  lines.push('- Prefer descriptive test names that explain the expected behavior');

  return lines.join('\n');
}

function commitSection(c: ProjectConfig): string {
  if (c.commitConvention === 'conventional') {
    return [
      '- Follow Conventional Commits: `type(scope): description`',
      '- Types: feat, fix, docs, style, refactor, test, chore',
      '- Write concise commit messages that explain the "why"',
    ].join('\n');
  }
  if (c.commitConvention === 'gitmoji') {
    return [
      '- Use Gitmoji for commit messages',
      '- Format: `:emoji: description`',
    ].join('\n');
  }
  return '- Write clear, descriptive commit messages';
}

function customRulesSection(c: ProjectConfig): string {
  const rules = c.customRules.split('\n').map(r => r.trim()).filter(Boolean);
  if (rules.length === 0) return '';
  return rules.map(r => `- ${r}`).join('\n');
}

// --- Format-specific generators ---

export function generateClaude(c: ProjectConfig): string {
  const sections: string[] = [];

  sections.push(`# ${c.name || 'Project'}`);
  if (c.description) {
    sections.push(`\n${c.description}`);
  }

  sections.push(`\n## Tech Stack\n\n${stackSummary(c)}`);

  sections.push(`\n## Commands\n\n${commandsSection(c)}`);

  const style = codeStyleSection(c);
  if (style) {
    sections.push(`\n## Code Style\n\n${style}`);
  }

  sections.push(`\n## Testing\n\n${testingSection(c)}`);

  sections.push(`\n## Commits\n\n${commitSection(c)}`);

  const custom = customRulesSection(c);
  if (custom) {
    sections.push(`\n## Project Rules\n\n${custom}`);
  }

  return sections.join('\n');
}

export function generateCursorrules(c: ProjectConfig): string {
  const sections: string[] = [];

  sections.push('# Cursor Rules');
  if (c.name) {
    sections.push(`\nProject: ${c.name}`);
  }
  if (c.description) {
    sections.push(`Description: ${c.description}`);
  }

  sections.push(`\n## Tech Stack\n\n${stackSummary(c)}`);

  sections.push(`\n## Commands\n\n${commandsSection(c)}`);

  const style = codeStyleSection(c);
  if (style) {
    sections.push(`\n## Code Style\n\n${style}`);
  }

  sections.push(`\n## Testing\n\n${testingSection(c)}`);

  sections.push(`\n## Git\n\n${commitSection(c)}`);

  const custom = customRulesSection(c);
  if (custom) {
    sections.push(`\n## Additional Rules\n\n${custom}`);
  }

  return sections.join('\n');
}

export function generateCopilot(c: ProjectConfig): string {
  const sections: string[] = [];

  sections.push('# Copilot Instructions');
  if (c.name) {
    sections.push(`\nThis is the ${c.name} project.`);
  }
  if (c.description) {
    sections.push(`${c.description}`);
  }

  sections.push(`\n## Technology\n\n${stackSummary(c)}`);

  const style = codeStyleSection(c);
  if (style) {
    sections.push(`\n## Code Style\n\n${style}`);
  }

  sections.push(`\n## Testing\n\n${testingSection(c)}`);

  sections.push(`\n## Conventions\n\n${commitSection(c)}`);

  const custom = customRulesSection(c);
  if (custom) {
    sections.push(`\n## Rules\n\n${custom}`);
  }

  return sections.join('\n');
}

export function generateWindsurf(c: ProjectConfig): string {
  const sections: string[] = [];

  sections.push('# Windsurf Rules');
  if (c.name) {
    sections.push(`\nProject: ${c.name}`);
  }
  if (c.description) {
    sections.push(`Description: ${c.description}`);
  }

  sections.push(`\n## Stack\n\n${stackSummary(c)}`);

  sections.push(`\n## Commands\n\n${commandsSection(c)}`);

  const style = codeStyleSection(c);
  if (style) {
    sections.push(`\n## Style\n\n${style}`);
  }

  sections.push(`\n## Testing\n\n${testingSection(c)}`);

  sections.push(`\n## Git\n\n${commitSection(c)}`);

  const custom = customRulesSection(c);
  if (custom) {
    sections.push(`\n## Custom Rules\n\n${custom}`);
  }

  return sections.join('\n');
}

export function generateAgents(c: ProjectConfig): string {
  const sections: string[] = [];

  sections.push(`# AGENTS.md`);
  if (c.name) {
    sections.push(`\nProject: ${c.name}`);
  }
  if (c.description) {
    sections.push(`${c.description}`);
  }

  sections.push(`\n## Overview\n\nTech stack: ${stackSummary(c)}`);

  sections.push(`\n## Development\n\n${commandsSection(c)}`);

  const style = codeStyleSection(c);
  if (style) {
    sections.push(`\n## Code Conventions\n\n${style}`);
  }

  sections.push(`\n## Testing Requirements\n\n${testingSection(c)}`);

  sections.push(`\n## Commit Guidelines\n\n${commitSection(c)}`);

  const custom = customRulesSection(c);
  if (custom) {
    sections.push(`\n## Agent-Specific Instructions\n\n${custom}`);
  }

  return sections.join('\n');
}

const GENERATORS: Record<OutputFormat, (c: ProjectConfig) => string> = {
  claude: generateClaude,
  cursorrules: generateCursorrules,
  copilot: generateCopilot,
  windsurf: generateWindsurf,
  agents: generateAgents,
};

export function generate(format: OutputFormat, config: ProjectConfig): string {
  return GENERATORS[format](config);
}
