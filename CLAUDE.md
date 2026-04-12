# Pokemon Duel - AI Agent Instructions

## Quick Reference

This is an Nx monorepo with Angular client, .NET server, and shared game logic.

**Run commands with:** `npx nx <target> <project>`

## Worktree Workflow

**Every task starts with a git worktree.** Before writing any code:
1. Invoke the `git-github` skill — it guides worktree setup → implementation → PR.
2. All work happens inside `.worktrees/<branch-name>/`

## Instructions

Read these files for detailed guidelines:

@.claude/instructions/general.md
@.claude/instructions/nx.md
@.claude/instructions/angular.md
@.claude/instructions/dotnet.md
@.claude/instructions/testing.md
@.claude/instructions/deployment.md
@.claude/instructions/git-github.md

## Skills

Use skills from `.github/skills/` for specific workflows:
- `git-github` — **Start here for every task.** Worktree → implement → PR.
- `nx-workspace` — Explore workspace structure
- `nx-generate` — Scaffold new code
- `nx-run-tasks` — Run build/test/lint tasks
- `nx-plugins` — Add Nx plugins
- `link-workspace-packages` — Wire up monorepo deps
- `monitor-ci` — Watch CI pipeline status
- `angular` — Angular component creation
- `dotnet` — .NET/SignalR hub and service patterns
- `firebase` — Firebase deployment
- `playwright` — E2E test writing
