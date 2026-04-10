# Agent Workflow Redesign — Design Spec

**Date:** 2026-04-10  
**Status:** Approved

## Goal

Two goals:
1. Enforce a worktree-first, PR-always development workflow through agent instruction files and skills — no manual steps, no exceptions.
2. Full rewrite of all agent files (instructions + skills) to best-practice standard — clear instruction/skill split, no duplication, no circular references.

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

---

## Full Agent File Rewrite

### The Core Problem

All existing skills end with "For complete patterns, read `.claude/instructions/X.md`" — backwards. Skills must be self-contained. Instructions must not contain procedures.

### Instruction vs Skill: The Distinction

| | Instructions (`.claude/instructions/`) | Skills (`.github/skills/`) |
|---|---|---|
| **When loaded** | Always — every conversation | On demand — when invoked |
| **Purpose** | Rules, conventions, constraints | Step-by-step procedures |
| **Content** | "What to do / what not to do" | "How to execute it" |
| **Length** | Short and stable | As long as needed |
| **Cross-references** | Reference skills for procedures | Self-contained, no back-references |

### Files to Rewrite

**Instruction files** — strip to rules only, remove all procedures:

| File | Keep | Remove |
|------|------|--------|
| `general.md` | Project structure, tech stack, documentation requirements | Any procedural steps |
| `nx.md` | "Always use npx nx", "never guess flags", Nx conventions | Common commands list → skill |
| `angular.md` | Signal inputs/outputs rule, control flow rule, file naming, component structure principles | Running commands → skill |
| `dotnet.md` | Project structure table, key SignalR patterns table | Running commands → skill |
| `testing.md` | What to test, test file conventions | Running test commands → skill |
| `deployment.md` | What deploys where, branch strategy | Deploy commands → skill |
| `git-github.md` | Golden rule, branch naming, commit types, PR requirements | Full workflow procedure → skill |

**Skill files** — make fully self-contained, procedural, no back-references:

| Skill | Rewrite focus |
|-------|--------------|
| `git-github` | Full worktree → implement → PR procedure (primary rewrite) |
| `angular` | Step-by-step component creation procedure; remove "read instructions" footer |
| `dotnet` | Step-by-step hub/service creation; remove "read instructions" footer |
| `nx-workspace` | Already good — light cleanup only |
| `nx-generate` | Already good — light cleanup only |
| `nx-run-tasks` | Check for back-references, fix if present |
| `nx-plugins` | Check for back-references, fix if present |
| `firebase` | Self-contained deploy procedure |
| `monitor-ci` | Self-contained CI monitoring procedure |
| `link-workspace-packages` | Self-contained wiring procedure |
| `playwright` | Self-contained E2E test procedure |

### Quality Bar for Every Rewritten File

**Instructions must pass:**
- [ ] Contains only rules and conventions (no step-by-step)
- [ ] No `pnpm nx` — always `npx nx`
- [ ] No "see skill X for how to do this" circularity
- [ ] Under ~80 lines (if longer, something procedural snuck in)

**Skills must pass:**
- [ ] Can be followed without reading any instruction file
- [ ] Has clear `description:` trigger conditions in frontmatter
- [ ] No "For complete patterns, read `.claude/instructions/X.md`" footer
- [ ] Commands use `npx nx` consistently
