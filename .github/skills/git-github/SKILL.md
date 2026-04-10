---
name: git-github
description: "Full task workflow for this project. INVOKE AT THE START OF EVERY TASK before writing any code. Covers worktree setup, implementation commits, PR creation, and cleanup. USE WHEN: starting any coding task, committing work, opening PRs, or following git conventions. EXAMPLES: 'start working on X', 'create a branch', 'open a PR', 'commit my changes'."
---

# Git Task Workflow

Invoke this skill at the start of every task, before writing any code.

## Step 1: Set Up Worktree

Invoke the `using-git-worktrees` superpowers skill to create an isolated workspace.

- Worktree directory: `.worktrees/` at the project root
- Safety check: verify `.worktrees/` is gitignored before creating

```bash
# Verify ignored
git check-ignore -q .worktrees && echo "ignored ✓"

# Create worktree with new branch
git worktree add .worktrees/<branch-name> -b <branch-name>

# Install dependencies
cd .worktrees/<branch-name> && npm install
```

Branch naming:

| Task type | Prefix | Example |
|-----------|--------|---------|
| New feature | `feature/` | `feature/lobby-ui` |
| Bug fix | `fix/` | `fix/disconnect-handling` |
| Documentation | `docs/` | `docs/architecture-update` |
| Agent config | `agents/` | `agents/angular-skill-update` |

## Step 2: Implement in the Worktree

All work happens inside `.worktrees/<branch-name>/`. Commit frequently:

```bash
# Stage specific files (never `git add -A` or `git add .`)
git add path/to/changed/file.ts

# Commit with conventional format
git commit -m "feature(client): add lobby component"
```

Commit format: `<type>(<scope>): <description>`

| Type | Use for |
|------|---------|
| `feature` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `style` | Formatting only |
| `refactor` | Code restructure |
| `test` | Tests |
| `infra` | Build, CI/CD, deps |
| `perf` | Performance |
| `agents` | AI agent instructions/skills |

Scopes: `client`, `server`, `board`, `docs`, `deps`, `ci`

Examples:
```bash
git commit -m "feature(client): add multiplayer lobby component"
git commit -m "fix(server): handle player disconnect during game"
git commit -m "test(board): add pathfinding unit tests"
git commit -m "infra(ci): add e2e tests to pipeline"
git commit -m "agents(skills): update angular skill"
```

## Step 3: Verify Before Completing

Invoke the `verification-before-completion` superpowers skill.

Run checks on affected projects:

```bash
# Lint and test
npx nx affected -t lint test

# Build (catches type errors)
npx nx affected -t build
```

All checks must pass before pushing.

## Step 4: Push Branch and Open PR

```bash
# Push branch
git push -u origin <branch-name>

# Open PR
gh pr create \
  --title "feature(client): add lobby component" \
  --body "$(cat <<'EOF'
## Summary
Brief description of what changed and why.

## Changes
- Added X
- Fixed Y
- Updated Z

## Testing
- [ ] Unit tests pass (`npx nx affected -t test`)
- [ ] Build passes (`npx nx affected -t build`)
- [ ] Manual testing: describe what you tested

## Screenshots
(attach if UI changes)
EOF
)"
```

PR title must follow the commit convention: `type(scope): description`.

## Step 5: Clean Up After Merge

Invoke the `finishing-a-development-branch` superpowers skill.

```bash
# Return to main
git checkout main
git pull origin main

# Remove the worktree
git worktree remove .worktrees/<branch-name>

# Delete local branch
git branch -d <branch-name>
```

## CI

CI runs automatically on every PR:
```bash
npx nx affected -t lint
npx nx affected -t test
npx nx affected -t build
```

Deploy triggers on push to `release/*` branches only.

## Quick Reference

| Action | Command |
|--------|---------|
| Create worktree | `git worktree add .worktrees/<name> -b <branch>` |
| List worktrees | `git worktree list` |
| Remove worktree | `git worktree remove .worktrees/<name>` |
| Push branch | `git push -u origin <branch>` |
| Create PR | `gh pr create --title "..." --body "..."` |
| View PR | `gh pr view` |
