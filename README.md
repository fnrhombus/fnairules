# fnairules

**Generate your CLAUDE.md in 30 seconds.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

[Try it now](https://fnairules.vercel.app)

---

Paste your `package.json`. Get a `CLAUDE.md`, `.cursorrules`, `copilot-instructions.md`, and more -- ready to drop into your repo.

## The problem

Every developer using AI coding tools writes config files from scratch. There is no generator for these files. **fnairules** is the GitHub Profile README Generator for AI config.

## What it does

1. **Paste** your `package.json` or `pyproject.toml` -- fnairules auto-detects your language, framework, testing setup, linter, and build tool.
2. **Customize** code style, commit conventions, testing preferences, and any custom rules.
3. **Export** config files for your AI tools. Copy to clipboard or download.

## Supported tools

| Tool | Config file |
|------|-------------|
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | `CLAUDE.md` |
| [Cursor](https://cursor.sh) | `.cursorrules` |
| [GitHub Copilot](https://github.com/features/copilot) | `.github/copilot-instructions.md` |
| [Windsurf](https://codeium.com/windsurf) | `.windsurfrules` |
| [Codex](https://openai.com/index/codex/) | `AGENTS.md` |

## Development

```bash
pnpm install
pnpm dev
```

## Support

If fnairules saves you time, consider supporting its development:

- [GitHub Sponsors](https://github.com/sponsors/fnrhombus)
- [Buy Me a Coffee](https://buymeacoffee.com/fnrhombus)

## License

MIT
