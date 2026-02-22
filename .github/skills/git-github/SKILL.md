---
name: git-github
description: "Git workflow and GitHub conventions for this project. USE WHEN committing code, creating branches, making PRs, or following git workflows. EXAMPLES: 'commit message', 'create branch', 'PR workflow', 'conventional commits'."
---

# Git & GitHub Workflow

## Branch Strategy

| Branch | Purpose | Auto-deploys |
|--------|---------|--------------|
| `main` | Development integration | No |
| `release/*` | Production releases (e.g., `release/1.0`, `release/2.0`) | Yes (Firebase + Cloud Run) |
| `feature/*` | New features | No |
| `fix/*` | Bug fixes | No |

## Feature Development Flow

```bash
# 1. Start from main
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feature/room-creation

# 3. Make changes and commit
git add .
git commit -m "feat(client): add room creation UI"

# 4. Push and create PR
git push -u origin feature/room-creation
# Then open PR to main on GitHub

# 5. After PR merge, deploy to production
git checkout release/1.0  # or create new release branch
git pull origin release/1.0
git merge main
git push origin release/1.0
```

## Commit Convention (Conventional Commits)

Format:
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Use for |
|------|---------|
| `feature` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting (no code change) |
| `refactor` | Code restructuring |
| `test` | Adding/updating tests |
| `infra` | Build, tooling, CI/CD, deps |
| `perf` | Performance improvement || `agents` | AI agent instructions, skills, workflows |
### Scopes (optional)

| Scope | Project |
|-------|---------|
| `client` | Angular app |
| `server` | .NET server |
| `board` | Board library |
| `docs` | Documentation |
| `deps` | Dependencies |

### Examples

```bash
# Feature
git commit -m "feature(client): add multiplayer lobby component"

# Bug fix
git commit -m "fix(server): handle player disconnect during game"

# Documentation
git commit -m "docs(agents): update architecture overview"

# Tests
git commit -m "test(board): add pathfinding unit tests"

# Infrastructure / Dependencies
git commit -m "infra(deps): update Angular to v21.1"
git commit -m "infra(ci): add e2e tests to pipeline"

# AI Agents
git commit -m "agents(skills): add angular skill"
git commit -m "agents(docs): restructure architecture docs"

# Breaking change (use ! or footer)
git commit -m "feature(server)!: change room ID format"
# or
git commit -m "feature(server): change room ID format

BREAKING CHANGE: Room IDs are now 8 characters instead of 6"
```

## Pull Request Workflow

### PR Title
Same format as commits:
```
feature(client): add room joining flow
```

### PR Description
```markdown
## Summary
Add ability for players to join existing rooms by entering a room code.

## Changes
- Added room code input in lobby
- Connected to server JoinRoom hub method
- Added error handling for invalid codes

## Testing
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing: created room, joined from another browser

## Screenshots
(attach if UI changes)
```

### Review Process
1. Open PR from feature branch to `main`
2. CI runs: lint, test, build
3. Request review
4. Address feedback
5. Merge when approved
6. Delete feature branch

## Useful Commands

```bash
# Check current branch and status
git status

# View commit history
git log --oneline -10

# Amend last commit
git commit --amend -m "fix(client): corrected message"

# Interactive rebase (squash commits)
git rebase -i HEAD~3

# Stash changes
git stash
git stash pop

# Undo last commit (keep changes)
git reset --soft HEAD~1

# View diff
git diff
git diff --staged
```

## CI/CD

CI runs automatically on PR:
```bash
pnpm nx affected -t lint
pnpm nx affected -t test
pnpm nx affected -t build
```

Deploy triggers automatically when pushing to `release/*` branches.

## Detailed Reference

For complete workflow, read `.claude/instructions/git-github.md`.
