# Pokemon Duel - AI Agent Instructions

## Quick Reference

This is an Nx monorepo with Angular client, .NET server, and shared game logic.

**Run commands with:** `pnpm nx <target> <project>`

## Instructions

Read these files for detailed guidelines (in `.claude/instructions/`):
- `general.md` - Project overview and structure
- `nx.md` - Nx workspace guidelines
- `angular.md` - Angular patterns (signals, zoneless)
- `dotnet.md` - .NET/SignalR conventions
- `testing.md` - Vitest and Playwright
- `deployment.md` - Firebase and Cloud Run
- `git-github.md` - Git workflow

## Architecture Documentation

For detailed architecture decisions, read from `apps/docs/src/content/agents/`.

## Skills

Use skills from `.github/skills/` for specific workflows:
- `nx-workspace` - Explore workspace structure
- `nx-generate` - Scaffold new code
- `nx-run-tasks` - Run build/test/lint tasks
- `nx-plugins` - Add Nx plugins
- `link-workspace-packages` - Wire up monorepo deps
- `monitor-ci` - Watch CI pipeline status
- `angular` - Angular patterns and conventions
- `dotnet` - .NET/SignalR patterns
- `firebase` - Firebase deployment
- `playwright` - E2E testing
- `git-github` - Git workflow and conventions