# Agent Workflow Redesign — Design Spec

**Date:** 2026-04-10  
**Status:** Approved

## Goal

Enforce a worktree-first, PR-always development workflow through agent instruction files and skills — no manual steps, no exceptions.

## Decisions

| Question | Decision |
|----------|----------|
| Worktree location | `.worktrees/` at project root |
| When to use worktrees | Every task, no exceptions |
| PR creation | Fully automatic (`git push` + `gh pr create`) |
| AGENTS.md | Delete — keep only CLAUDE.md |
| Instructions vs skill split | Instructions = rules only; skill = full procedure |

## File Changes

| File | Action | Summary |
|------|--------|---------|
| `AGENTS.md` | Delete | Duplicate of CLAUDE.md |
| `CLAUDE.md` | Update | Add worktree convention, fix `npx nx` consistency |
| `.claude/instructions/git-github.md` | Slim down | Rules only — branch naming, commit types, PR requirements |
| `.github/skills/git-github/SKILL.md` | Expand | Full procedure: worktree → implement → PR |
| `.claude/settings.json` | Update | Add git push, git worktree, gh pr permissions |
| `.gitignore` | Update | Add `.worktrees/` entry |

## Skill Procedure (`git-github` skill)

The skill is the authoritative, step-by-step guide Claude follows for every task:

### 1. Setup (before any code)
- Invoke `using-git-worktrees` superpowers skill
- Worktree directory: `.worktrees/` at project root
- Branch name follows convention: `feature/*`, `fix/*`, `agents/*`, `docs/*`
- Run `npm install` in the worktree

### 2. Implement (inside the worktree)
- All work happens inside `.worktrees/<branch-name>/`
- Commit with conventional commits as work progresses

### 3. Complete (after implementation)
- Invoke `verification-before-completion` superpowers skill
- Push branch: `git push -u origin <branch>`
- Open PR: `gh pr create` with conventional title and body template
- Invoke `finishing-a-development-branch` superpowers skill

## Instruction File Split

**`.claude/instructions/git-github.md` keeps only:**
- Golden rule (never push to main)
- Branch naming table
- Commit type table with examples
- PR requirements (title format, description sections, approval)

**`.github/skills/git-github/SKILL.md` owns:**
- Step-by-step workflow (setup → implement → complete)
- Worktree setup procedure
- PR creation commands and templates
- CI/CD notes

## `settings.json` Permissions

### Add to allow
```json
"Bash(git push *)",
"Bash(git worktree *)",
"Bash(gh pr create *)",
"Bash(gh pr view *)"
```

### Replace force-push deny
Remove: `"Bash(git push --force*)"` (blanket deny)

Add targeted denies (block force push to main only):
```json
"Bash(git push --force* * main)",
"Bash(git push --force-with-lease* * main)",
"Bash(git push -f * main)"
```

Force push to feature branches remains allowed (needed for rebasing during development).

## `.gitignore` Addition

```
.worktrees/
```

## CLAUDE.md Updates

- Remove reference to `AGENTS.md`
- Add worktree convention: "Every task starts with a worktree in `.worktrees/`"
- Fix command prefix consistency: `npx nx` throughout
- Add note to invoke `git-github` skill for all git/PR work
