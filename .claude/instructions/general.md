# Pokemon Duel - Project Overview

## Workspace Structure

This is an Nx monorepo with the following projects:

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

### Documentation Structure

```
apps/docs/src/content/agents/
├── index.md                 # Overview and navigation
├── architecture/            # System design docs
│   ├── system-overview.md
│   ├── realtime-multiplayer.md
│   └── database-strategy.md
├── patterns/                # Coding conventions
│   └── angular.md
├── features/                # Feature-specific docs
│   └── (created as features are built)
└── decisions/               # Architecture Decision Records
    └── (created when making significant choices)
```

### When to Update vs. Create

| Situation | Action |
|-----------|--------|
| Modifying existing system | Update doc in `architecture/` |
| Changing patterns/conventions | Update doc in `patterns/` |
| Adding new feature | Create doc in `features/<feature-name>.md` |
| Making architectural choice | Create doc in `decisions/<decision-name>.md` |
| Bug fix or minor change | Skip unless architecture-relevant |

### What to Document

- **Architecture** - System design, component interactions
- **Patterns** - Recurring solutions, conventions
- **Features** - What it does, how it works, API contracts
- **Decisions** - Why we chose X over Y, trade-offs

## Conventions

- Use `npm` as package manager (`package-lock.json`)
- Run tasks via Nx: `npx nx <target> <project>`
- Follow conventional commits for Git messages
- Keep components small and focused
