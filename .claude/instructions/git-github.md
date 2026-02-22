# Git & GitHub Guidelines

## Golden Rule

**NEVER push directly to `main`.** All changes must go through a Pull Request with approval.

## Branch Strategy

| Branch | Purpose | Deploys To | Direct Push |
|--------|---------|------------|-------------|
| `main` | Development, integration | - | **BLOCKED** |
| `release/*` | Production releases (e.g., `release/1.0`) | Firebase + Cloud Run | No |
| `feature/*` | New features | - | Yes |
| `fix/*` | Bug fixes | - | Yes |
| `agents/*` | AI agent config changes | - | Yes |

## Workflow

```bash
# 1. Start from main
git checkout main
git pull origin main

# 2. Create branch (NEVER work on main)
git checkout -b feature/my-feature

# 3. Make changes and commit
git add .
git commit -m "feature: add new feature"

# 4. Push branch (NOT main!)
git push -u origin feature/my-feature

# 5. Open PR on GitHub with:
#    - Title: type(scope): description
#    - Summary of all changes
#    - Request review
#    - Wait for APPROVAL before merge

# 6. After PR is approved and merged
git checkout main
git pull origin main
git branch -d feature/my-feature
```

## Pull Request Requirements

Every PR must have:
1. **Title** - Conventional commit format
2. **Summary** - Description of all changes made
3. **Testing** - How changes were verified
4. **Approval** - Manual review before merge

## Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]
[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feature` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code change, no feature/fix |
| `test` | Adding/fixing tests |
| `infra` | Build, tooling, CI/CD, deps |
| `agents` | AI agent instructions, skills, workflows |

### Examples

```bash
feature(client): add room creation UI
fix(server): handle disconnection edge case
docs(agents): update architecture overview
test(board): add pathfinding unit tests
infra(deps): update Angular to v21.1
infra(ci): add e2e tests to pipeline
agents(skills): add angular skill
agents(docs): restructure architecture docs
```

## Pull Requests

### PR Title

Same format as commits:
```
feature(client): add multiplayer lobby
```

### PR Description Template

```markdown
## Summary
Brief description of changes

## Changes
- Added X
- Fixed Y
- Updated Z

## Testing
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing done

## Screenshots (if UI)
```

## GitHub Actions

CI runs on every PR:
- `pnpm nx affected -t lint`
- `pnpm nx affected -t test`
- `pnpm nx affected -t build`
