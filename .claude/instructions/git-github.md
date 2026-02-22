# Git & GitHub Guidelines

## Branch Strategy

| Branch | Purpose | Deploys To |
|--------|---------|------------|
| `main` | Development, integration | - |
| `release/*` | Production releases (e.g., `release/1.0`) | Firebase + Cloud Run |
| `feature/*` | New features | - |
| `fix/*` | Bug fixes | - |

## Workflow

```bash
# Start new feature
git checkout main
git pull
git checkout -b feature/my-feature

# Work on feature...
git add .
git commit -m "feature: add new feature"

# Push and create PR
git push -u origin feature/my-feature
# Open PR to main

# After PR merge, deploy
git checkout release/1.0  # or create new release branch
git merge main
git push
```

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
