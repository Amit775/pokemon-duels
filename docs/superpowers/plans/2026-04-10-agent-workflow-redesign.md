# Agent Workflow Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce a worktree-first, PR-always workflow and rewrite all agent files to a clear instruction/skill split with no duplication or circular references.

**Architecture:** Instructions (`.claude/instructions/`) hold rules and conventions only — no procedures. Skills (`.github/skills/`) hold self-contained step-by-step procedures — no back-references to instructions. The `git-github` skill becomes the single authoritative workflow guide Claude invokes at the start of every task.

**Tech Stack:** Markdown files, `.claude/settings.json`, `.gitignore`, `gh` CLI for PR creation.

**Spec:** `docs/superpowers/specs/2026-04-10-agent-workflow-redesign.md`

---

## File Map

| File | Action |
|------|--------|
| `.gitignore` | Add `.worktrees/` entry |
| `.claude/settings.json` | Add git push/worktree/gh permissions; fix force-push denies |
| `AGENTS.md` | Delete |
| `CLAUDE.md` | Add worktree convention, fix npx consistency, reorder skills |
| `.claude/instructions/git-github.md` | Rewrite — rules only |
| `.claude/instructions/general.md` | Trim — remove procedures |
| `.claude/instructions/nx.md` | Trim — remove common commands list |
| `.claude/instructions/angular.md` | Trim — remove running commands section |
| `.claude/instructions/dotnet.md` | Trim — remove running commands section |
| `.claude/instructions/testing.md` | Trim — remove running commands sections |
| `.claude/instructions/deployment.md` | Trim — remove deploy commands |
| `.github/skills/git-github/SKILL.md` | Rewrite — full worktree→implement→PR procedure |
| `.github/skills/angular/SKILL.md` | Fix — remove back-reference footer, fix `pnpm nx` → `npx nx` |
| `.github/skills/dotnet/SKILL.md` | Fix — remove back-reference footer, fix `pnpm nx` → `npx nx` |
| `.github/skills/firebase/SKILL.md` | Fix — remove back-reference footer, fix `pnpm nx` → `npx nx` |
| `.github/skills/playwright/SKILL.md` | Fix — remove back-reference footer, fix `pnpm nx` → `npx nx` |
| `.github/skills/nx-plugins/SKILL.md` | Expand — currently only 2 lines |
| `.github/skills/nx-run-tasks/SKILL.md` | Fix — add project-specific commands, fix package manager |

---

## Task 1: Foundation — `.gitignore` and `settings.json`

**Files:**
- Modify: `.gitignore`
- Modify: `.claude/settings.json`

- [ ] **Step 1: Add `.worktrees/` to `.gitignore`**

Add after the existing `# Claude` section:

```
# Claude
.claude/worktrees
.claude/settings.local.json
.worktrees/
```

- [ ] **Step 2: Rewrite `settings.json` with updated permissions**

Replace the entire file with:

```json
{
  "permissions": {
    "allow": [
      "Bash(npx nx *)",
      "Bash(npx nx affected *)",
      "Bash(npx nx graph *)",
      "Bash(npx nx show *)",
      "Bash(npm run *)",
      "Bash(npm ci)",
      "Bash(npm install)",
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(git log *)",
      "Bash(git add *)",
      "Bash(git commit *)",
      "Bash(git branch *)",
      "Bash(git checkout *)",
      "Bash(git push *)",
      "Bash(git worktree *)",
      "Bash(gh pr create *)",
      "Bash(gh pr view *)"
    ],
    "deny": [
      "Bash(git push --force* * main)",
      "Bash(git push --force-with-lease* * main)",
      "Bash(git push -f * main)",
      "Bash(git reset --hard*)",
      "Bash(rm -rf *)"
    ]
  },
  "extraKnownMarketplaces": {
    "nx-claude-plugins": {
      "source": {
        "source": "github",
        "repo": "nrwl/nx-ai-agents-config"
      }
    }
  },
  "enabledPlugins": {
    "nx@nx-claude-plugins": true
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add .gitignore .claude/settings.json
git commit -m "agents(config): add worktree permissions and gitignore entry"
```

---

## Task 2: Delete `AGENTS.md` and Update `CLAUDE.md`

**Files:**
- Delete: `AGENTS.md`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Delete `AGENTS.md`**

```bash
git rm AGENTS.md
```

- [ ] **Step 2: Rewrite `CLAUDE.md`**

Replace the entire file with:

```markdown
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

## Architecture Documentation

For detailed architecture decisions, read from `apps/docs/src/content/agents/`.

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
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "agents(config): delete AGENTS.md, update CLAUDE.md with worktree convention"
```

---

## Task 3: Rewrite `git-github` Instruction (Rules Only)

**Files:**
- Modify: `.claude/instructions/git-github.md`

- [ ] **Step 1: Replace with rules-only version**

Replace the entire file with:

```markdown
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

Scopes: `client`, `server`, `board`, `docs`, `deps`, `ci`

## PR Requirements

Every PR must have:
1. **Title** — `type(scope): description` format
2. **Summary** — what changed and why
3. **Testing** — how verified (unit / e2e / manual)
4. **Approval** — at least one reviewer before merge
```

- [ ] **Step 2: Commit**

```bash
git add .claude/instructions/git-github.md
git commit -m "agents(instructions): slim git-github to rules only"
```

---

## Task 4: Rewrite `git-github` Skill (Full Procedure)

**Files:**
- Modify: `.github/skills/git-github/SKILL.md`

- [ ] **Step 1: Replace with full worktree→implement→PR procedure**

Replace the entire file with:

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add .github/skills/git-github/SKILL.md
git commit -m "agents(skills): rewrite git-github skill with full worktree→PR procedure"
```

---

## Task 5: Trim Instruction Files — Part 1 (general, nx)

**Files:**
- Modify: `.claude/instructions/general.md`
- Modify: `.claude/instructions/nx.md`

- [ ] **Step 1: Rewrite `general.md`**

Replace the entire file with:

```markdown
# Pokemon Duel - Project Overview

## Workspace Structure

| Project | Type | Description |
|---------|------|-------------|
| `client` | Angular app | Browser-based game client |
| `server` | .NET app | SignalR game server (C#) |
| `docs` | Analog app | Documentation site (SSR) |
| `board` | Library | Shared game logic and models |

## Technology Stack

- **Frontend:** Angular 21+ (signals, zoneless, standalone)
- **Backend:** .NET 10 with SignalR
- **Build:** Nx workspace with task orchestration
- **Hosting:** Firebase Hosting (client), Google Cloud Run (server)
- **Testing:** Vitest (unit), Playwright (e2e)

## Key Files

| File | Purpose |
|------|---------|
| `board.json` | Game board definition (spots, passages) |
| `firebase.json` | Firebase Hosting configuration |
| `cloudbuild.yaml` | GCP Cloud Build pipeline |
| `nx.json` | Nx workspace configuration |

## Documentation Requirements

**Every task must be documented.** When completing work, update or create documentation in `apps/docs/src/content/agents/`.

### When to Update vs. Create

| Situation | Action |
|-----------|--------|
| Modifying existing system | Update doc in `architecture/` |
| Changing patterns/conventions | Update doc in `patterns/` |
| Adding new feature | Create doc in `features/<feature-name>.md` |
| Making architectural choice | Create doc in `decisions/<decision-name>.md` |
| Bug fix or minor change | Skip unless architecture-relevant |

### What to Document

- **Architecture** — System design, component interactions
- **Patterns** — Recurring solutions, conventions
- **Features** — What it does, how it works, API contracts
- **Decisions** — Why we chose X over Y, trade-offs

## Conventions

- Package manager: `npm` (`package-lock.json`)
- Run tasks via Nx: `npx nx <target> <project>`
- Follow conventional commits for Git messages
- Keep components small and focused
```

- [ ] **Step 2: Rewrite `nx.md`**

Replace the entire file with:

```markdown
# Nx Workspace Guidelines

## Rules

- Run all tasks through Nx: `npx nx <target> <project>` or `npx nx run-many`
- **NEVER** use underlying tools directly (e.g. `ng build`, `dotnet build`)
- **NEVER** guess CLI flags — check `--help` or `nx_docs` first when unsure
- For navigating the workspace, invoke the `nx-workspace` skill first
- For scaffolding (new apps, libs, generators), invoke the `nx-generate` skill first
- For running tasks (build, test, lint, serve), invoke the `nx-run-tasks` skill first
- For adding plugins, invoke the `nx-plugins` skill first
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md` if it exists

## When to Use `nx_docs`

| Use `nx_docs` for | Skip `nx_docs` for |
|---|---|
| Advanced config options | Basic generator syntax |
| Unfamiliar flags | Standard commands |
| Migration guides | Things you already know |
| Plugin configuration | Generator discovery (use nx-generate skill) |
| Edge cases | |

## Package Manager

This workspace uses **npm** (`package-lock.json`). Always prefix Nx with `npx`:

```bash
npx nx <command>
```
```

- [ ] **Step 3: Commit**

```bash
git add .claude/instructions/general.md .claude/instructions/nx.md
git commit -m "agents(instructions): trim general and nx to rules only"
```

---

## Task 6: Trim Instruction Files — Part 2 (angular, dotnet)

**Files:**
- Modify: `.claude/instructions/angular.md`
- Modify: `.claude/instructions/dotnet.md`

- [ ] **Step 1: Rewrite `angular.md`**

Replace the entire file with:

```markdown
# Angular Development Rules

This project uses **Angular 21+** with modern patterns. Follow these conventions strictly.

## Signal-Based Inputs/Outputs (Required)

**Always** use signal-based inputs and outputs. **Never** use decorators.

```typescript
// ✅ Required
spot = input.required<Spot>();
selected = input(false);
spotClicked = output<Spot>();
```

```typescript
// ❌ Never use
@Input() spot!: Spot;
@Output() spotClicked = new EventEmitter<Spot>();
constructor(private service: DataService) {}
```

Use `inject()` for dependency injection, never constructor injection.

## Control Flow (Required)

**Always** use built-in control flow. **Never** use structural directives.

```html
<!-- ✅ Required -->
@if (condition) { ... } @else { ... }
@for (item of items(); track item.id) { ... } @empty { ... }
@switch (type()) { @case ('x') { ... } @default { ... } }
```

```html
<!-- ❌ Never use -->
<div *ngIf="...">
<div *ngFor="let item of items">
```

## Component Structure

- `ChangeDetectionStrategy.OnPush` — always
- `standalone: true` — always
- Separate files: `example.ts`, `example.html`, `example.scss`
- Injection: `private readonly x = inject(X)` at class level
- Order: inputs → outputs → injected services → computed signals → methods

## Component Design

- One component = one purpose. Split if it does multiple things.
- Keep templates under ~50 lines. Extract child components if larger.
- Business logic belongs in services, not components.

## State Management

Use **@ngrx/signals** (`signalStore`, `withState`, `withMethods`, `withComputed`) for component and feature state.

## Key APIs

| API | Purpose |
|-----|---------|
| `input()` / `input.required()` | Component inputs |
| `output()` | Component outputs |
| `computed()` | Derived state |
| `linkedSignal()` | Two-way binding |
| `resource()` | Async data fetching |
| `inject()` | Dependency injection |

## Avoid `effect()`

`effect()` is a last resort. Prefer:
- `computed()` for derived state
- `resource()` for async data
- `linkedSignal()` for form sync

`effect()` is appropriate only for: logging/analytics, third-party library integration, DOM manipulation outside Angular's control.

## File Naming

- Components: `example.ts`, `example.html`, `example.scss`
- Services: `example.service.ts`
- Models: `example.model.ts`
- Stores: `example.store.ts`

For implementation patterns, invoke the `angular` skill.
```

- [ ] **Step 2: Rewrite `dotnet.md`**

Replace the entire file with:

```markdown
# .NET Server Rules

The server uses **.NET 10** with **SignalR** for real-time game communication.

## Project Structure

```
apps/server/
├── Program.cs              # Entry point, DI configuration
├── Hubs/GameHub.cs         # SignalR hub
├── Services/               # Business logic services
├── Models/                 # DTOs and models
└── appsettings.json        # Configuration
```

## Conventions

- Hub methods are `async Task` or `async Task<T>` — never `void`
- Use `Context.ConnectionId` to identify clients
- Use `Groups` for room-based routing — never broadcast to all unless truly global
- Use `Clients.Caller` for response to the calling client
- Use `Clients.Group(roomId)` to broadcast to a room
- Always override `OnDisconnectedAsync` to clean up room state
- Services use `ConcurrentDictionary` for thread-safe shared state
- Models use C# `record` types for immutability
- CORS is configured in `Program.cs` — do not add it in other places

## SignalR Client Targeting

| Target | Use for |
|--------|---------|
| `Clients.Caller` | Response to the calling client |
| `Clients.Client(id)` | Specific connection |
| `Clients.Group(roomId)` | All clients in a room |
| `Clients.GroupExcept(roomId, id)` | Room except the caller |
| `Clients.All` | All connected clients (avoid unless necessary) |

## Model Convention

Use `record` types with `required` and `init`:

```csharp
public record GameRoom
{
    public required string RoomId { get; init; }
    public List<Player> Players { get; init; } = [];
}
```

For implementation patterns and commands, invoke the `dotnet` skill.
```

- [ ] **Step 3: Commit**

```bash
git add .claude/instructions/angular.md .claude/instructions/dotnet.md
git commit -m "agents(instructions): trim angular and dotnet to rules only"
```

---

## Task 7: Trim Instruction Files — Part 3 (testing, deployment)

**Files:**
- Modify: `.claude/instructions/testing.md`
- Modify: `.claude/instructions/deployment.md`

- [ ] **Step 1: Rewrite `testing.md`**

Replace the entire file with:

```markdown
# Testing Rules

## Unit Tests (Vitest)

- Test files: `*.spec.ts` alongside source files
- Test runner: Vitest with Angular `TestBed`
- Run via Nx: `npx nx test <project>` (never `vitest` directly)
- Use `describe` + `it` structure
- Use `TestBed.configureTestingModule` for Angular component tests
- Use `fixture.componentRef.setInput()` to set signal inputs in tests

## E2E Tests (Playwright)

- Test files: `apps/client/e2e/*.spec.ts`
- Run via Nx: `npx nx e2e client` (never `playwright` directly)
- Use `data-testid` attributes for stable selectors
- Prefer `getByRole` over CSS selectors
- Assert visibility with `toBeVisible()`, not existence

## Selector Priority

| Priority | Selector | Example |
|----------|----------|---------|
| 1st | `data-testid` | `page.getByTestId('game-board')` |
| 2nd | Accessible role | `page.getByRole('button', { name: 'Create' })` |
| 3rd | Label/placeholder | `page.getByLabel('Room ID')` |
| Avoid | CSS selectors | `page.locator('.game-board')` |

## Coverage

- New features must include unit tests
- UI interactions must have e2e coverage
- Pure logic (board library) must have full unit coverage

For running test commands, invoke the `playwright` or `nx-run-tasks` skill.
```

- [ ] **Step 2: Rewrite `deployment.md`**

Replace the entire file with:

```markdown
# Deployment Rules

## What Deploys Where

| Component | Platform | Trigger |
|-----------|----------|---------|
| Client (Angular) | Firebase Hosting | Push to `release/*` |
| Server (.NET) | Google Cloud Run | Push to `release/*` |

## Branch Strategy

| Branch | Purpose | Deploys |
|--------|---------|---------|
| `main` | Development integration | No |
| `release/*` | Production cuts (e.g. `release/1.0`) | Yes — both Firebase + Cloud Run |

**Never merge feature branches directly to `release/*`.** Always merge to `main` first, then cut a release branch.

## Configuration Files

| File | Controls |
|------|---------|
| `firebase.json` | Firebase Hosting: public dir, rewrites, cache headers |
| `cloudbuild.yaml` | GCP Cloud Build pipeline steps |
| `Dockerfile` | .NET server container image |

## Environment Variables

| Variable | Location | Purpose |
|----------|----------|---------|
| `FIREBASE_TOKEN` | Cloud Build secrets | Firebase CLI auth in CI |
| Server URL | `environment.prod.ts` | Client → server connection |

For deploy commands and troubleshooting, invoke the `firebase` skill.
```

- [ ] **Step 3: Commit**

```bash
git add .claude/instructions/testing.md .claude/instructions/deployment.md
git commit -m "agents(instructions): trim testing and deployment to rules only"
```

---

## Task 8: Fix Angular and Dotnet Skills

**Files:**
- Modify: `.github/skills/angular/SKILL.md`
- Modify: `.github/skills/dotnet/SKILL.md`

- [ ] **Step 1: Fix `angular/SKILL.md`**

Remove the "Detailed Reference" footer at the bottom:

```
## Detailed Reference

For complete patterns, read `.claude/instructions/angular.md` or `apps/docs/src/content/agents/patterns/angular.md`.
```

Replace all occurrences of `pnpm nx` with `npx nx` in the "Running Angular Commands" section:

```bash
# Serve client
npx nx serve client

# Build for production
npx nx build client --configuration=production

# Run tests
npx nx test client

# Generate component (use nx-generate skill)
npx nx g @nx/angular:component my-component --project=client
```

- [ ] **Step 2: Fix `dotnet/SKILL.md`**

Remove the "Detailed Reference" footer at the bottom:

```
## Detailed Reference

For more patterns, read `.claude/instructions/dotnet.md`.
```

Replace all occurrences of `pnpm nx` with `npx nx` in the "Running the Server" section:

```bash
# Development with hot reload
npx nx serve server

# Build
npx nx build server

# Deploy to Cloud Run
npx nx deploy server
```

- [ ] **Step 3: Commit**

```bash
git add .github/skills/angular/SKILL.md .github/skills/dotnet/SKILL.md
git commit -m "agents(skills): remove back-references, fix npx prefix in angular and dotnet skills"
```

---

## Task 9: Fix Firebase and Playwright Skills

**Files:**
- Modify: `.github/skills/firebase/SKILL.md`
- Modify: `.github/skills/playwright/SKILL.md`

- [ ] **Step 1: Fix `firebase/SKILL.md`**

Remove the "Detailed Reference" footer at the bottom:

```
## Detailed Reference

For deployment workflow, read `.claude/instructions/deployment.md`.
```

Replace all occurrences of `pnpm nx` with `npx nx` in the "Deploy Commands" section:

```bash
# Build for production first
npx nx build client --configuration=production

# Deploy via Nx target
npx nx deploy client

# Or deploy directly with Firebase CLI
firebase deploy --only hosting
```

Also replace `pnpm firebase:login` with `npm run firebase:login` in the "Setup / Login" section.

- [ ] **Step 2: Fix `playwright/SKILL.md`**

Remove the "Detailed Reference" footer at the bottom:

```
## Detailed Reference

For testing guidelines, read `.claude/instructions/testing.md`.
```

Replace all occurrences of `pnpm nx` with `npx nx` throughout:

```bash
# Run all e2e tests
npx nx e2e client

# Run with UI mode (interactive)
npx nx e2e client -- --ui

# Run specific test file
npx nx e2e client -- e2e/multiplayer.spec.ts

# Run specific test by name
npx nx e2e client -- -g "should create room"

# Debug mode (opens browser with inspector)
npx nx e2e client -- --debug

# Generate test from recording
npx nx e2e client -- --codegen
```

Also update the `webServer` command in the Configuration section from `npx nx serve client` (this one is already correct — leave it).

- [ ] **Step 3: Commit**

```bash
git add .github/skills/firebase/SKILL.md .github/skills/playwright/SKILL.md
git commit -m "agents(skills): remove back-references, fix npx prefix in firebase and playwright skills"
```

---

## Task 10: Expand `nx-plugins` Skill and Fix `nx-run-tasks` Skill

**Files:**
- Modify: `.github/skills/nx-plugins/SKILL.md`
- Modify: `.github/skills/nx-run-tasks/SKILL.md`

- [ ] **Step 1: Rewrite `nx-plugins/SKILL.md`**

Replace the entire file (currently only 2 lines) with:

```markdown
---
name: nx-plugins
description: "Find and add Nx plugins to the workspace. USE WHEN adding support for a new framework or technology, discovering available plugins, or installing a plugin. EXAMPLES: 'add React support', 'install @nx/vite', 'what plugins are available', 'add a new framework'."
---

# Nx Plugins

## List Available Plugins

```bash
# List all installed plugins and their generators
npx nx list

# List generators for a specific plugin
npx nx list @nx/angular
npx nx list @nx/node
```

## Install a Plugin

```bash
# Install plugin and register it in nx.json
npx nx add @nx/angular
npx nx add @nx/vite
npx nx add @nx/node
```

`nx add` installs the package and configures the plugin in `nx.json` automatically. Do not use `npm install` alone for Nx plugins.

## Common Plugins in This Stack

| Plugin | Purpose |
|--------|---------|
| `@nx/angular` | Angular apps and libraries |
| `@nx/node` | Node.js apps and libraries |
| `@nx/vite` | Vite-based builds and tests |
| `@nx/playwright` | Playwright e2e testing |
| `@nx/esbuild` | Fast esbuild bundling |

## After Installing

Run `npx nx list @nx/<plugin>` to see what generators are now available.
Then invoke the `nx-generate` skill to scaffold code with the new plugin.

## Check Installed Plugin Version

```bash
cat node_modules/@nx/<plugin>/package.json | grep '"version"'
```

## Plugin Configuration

Plugin options live in `nx.json` under the `plugins` array. Read `node_modules/@nx/<plugin>/PLUGIN.md` if it exists for plugin-specific configuration options.
```

- [ ] **Step 2: Fix `nx-run-tasks/SKILL.md`**

Replace the opening paragraph to remove ambiguity about package manager, and add project-specific examples. Replace the entire file with:

```markdown
---
name: nx-run-tasks
description: "Run build, test, lint, serve, or any Nx task. USE WHEN executing tasks defined in the workspace. EXAMPLES: 'run tests', 'build the client', 'lint affected projects', 'serve the app', 'run all checks'."
---

# Running Nx Tasks

This workspace uses **npm**. Prefix all Nx commands with `npx`:

```bash
npx nx <command>
```

## Discover Available Tasks

```bash
# See all targets for a project
npx nx show project client --json | jq '.targets | keys'
npx nx show project server --json | jq '.targets | keys'
npx nx show project board --json | jq '.targets | keys'
```

## Run a Single Task

```bash
npx nx run <project>:<task>

# Examples
npx nx serve client       # Angular dev server on :4200
npx nx serve server       # .NET server on :5000
npx nx serve docs         # Docs site on :5173
npx nx test board         # Unit tests for board library
npx nx test client        # Unit tests for Angular client
npx nx e2e client         # Playwright e2e tests
npx nx build client --configuration=production
npx nx deploy client      # Firebase Hosting
npx nx deploy server      # Cloud Run
```

## Run Multiple Tasks

```bash
npx nx run-many -t build test lint
npx nx run-many -t test -p client board      # specific projects
npx nx run-many -t lint --exclude docs       # exclude a project
```

## Run Only Affected Projects

```bash
# Run on changed projects and their dependents
npx nx affected -t lint test build

# Customize base comparison
npx nx affected -t test --base=main --head=HEAD
```

## Useful Flags

| Flag | Purpose |
|------|---------|
| `--skipNxCache` | Rerun even when cached |
| `--verbose` | Print stack traces and extra info |
| `--nxBail` | Stop after first failure |
| `--configuration=production` | Use a specific configuration |
| `--parallel=5` | Control parallel task count |

For more detail on any command: `npx nx <command> --help`
```

- [ ] **Step 3: Commit**

```bash
git add .github/skills/nx-plugins/SKILL.md .github/skills/nx-run-tasks/SKILL.md
git commit -m "agents(skills): expand nx-plugins, add project-specific examples to nx-run-tasks"
```

---

## Task 11: Final Verification

- [ ] **Step 1: Check all instruction files are rules-only**

```bash
# Verify no instruction file references pnpm nx
grep -r "pnpm nx" .claude/instructions/

# Verify no instruction file has step-by-step procedures (numbered steps or bash code blocks that are not examples)
# Read each file and confirm it contains only rules, conventions, and tables
```

Expected output: no matches for `pnpm nx`.

- [ ] **Step 2: Check all skills have no back-references**

```bash
# Verify no skill file references .claude/instructions
grep -r "\.claude/instructions" .github/skills/

# Verify no skill file uses pnpm nx
grep -r "pnpm nx" .github/skills/
```

Expected output: no matches for either pattern.

- [ ] **Step 3: Verify .worktrees is gitignored**

```bash
git check-ignore -v .worktrees/
```

Expected output: `.gitignore:45:.worktrees/    .worktrees/` (line number may differ).

- [ ] **Step 4: Verify settings.json is valid JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('.claude/settings.json', 'utf8')); console.log('valid ✓')"
```

Expected output: `valid ✓`

- [ ] **Step 5: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "agents(config): final verification fixes"
```

- [ ] **Step 6: Open PR**

```bash
git push -u origin agents/agent-workflow-redesign

gh pr create \
  --title "agents(config): worktree-first workflow and full agent file rewrite" \
  --body "$(cat <<'EOF'
## Summary
Complete redesign of agent instruction files and skills for this project.

## Changes

### Workflow
- Every task now starts with a git worktree in `.worktrees/`
- PR creation is fully automatic via `gh pr create`
- `git push` and `git worktree` permissions added to `settings.json`
- Force push to `main` blocked; force push to feature branches allowed

### File cleanup
- Deleted `AGENTS.md` (duplicate of `CLAUDE.md`)
- Updated `CLAUDE.md` with worktree convention and consistent `npx nx` usage

### Instruction files (rules only)
- All 7 instruction files rewritten to contain rules and conventions only
- Procedures, running commands, and step-by-step guides removed

### Skill files (self-contained procedures)
- `git-github` skill fully rewritten: worktree setup → implementation → PR creation → cleanup
- `angular`, `dotnet`, `firebase`, `playwright` skills: removed circular back-references to instructions
- `angular`, `dotnet`, `firebase`, `playwright` skills: fixed `pnpm nx` → `npx nx`
- `nx-plugins` skill expanded from 2 lines to a complete guide
- `nx-run-tasks` skill updated with project-specific examples

## Testing
- [ ] Verified no instruction file contains `pnpm nx`
- [ ] Verified no skill file back-references `.claude/instructions/`
- [ ] Verified `.worktrees/` is gitignored
- [ ] Verified `settings.json` is valid JSON
EOF
)"
```
