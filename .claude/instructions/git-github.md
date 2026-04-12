# Git & GitHub Rules

## Golden Rule

**NEVER push directly to `main`.** All changes go through a Pull Request with approval.

For the full step-by-step procedure, invoke the `git-github` skill.

## Branch Naming

| Branch | Purpose | Direct Push |
|--------|---------|-------------|
| `main` | Integration | **BLOCKED** |
| `release/*` | Production releases | No |
| `feature/*` | New features | Yes |
| `fix/*` | Bug fixes | Yes |
| `agents/*` | AI agent config changes | Yes |
| `docs/*` | Documentation | Yes |

## Commit Convention

Format: `<type>(<scope>): <description>`

| Type | Use for |
|------|---------|
| `feature` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Code restructure |
| `test` | Adding or fixing tests |
| `infra` | Build, CI/CD, deps |
| `perf` | Performance improvement |
| `agents` | AI agent instructions, skills, workflows |

Scopes: `client`, `server`, `board`, `deps`, `ci`

## PR Requirements

Every PR must have:
1. **Title** — `type(scope): description` format
2. **Summary** — what changed and why
3. **Testing** — how verified (unit / e2e / manual)
4. **Approval** — at least one reviewer before merge
