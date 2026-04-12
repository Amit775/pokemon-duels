# Pokemon Duel - Project Overview

## Workspace Structure

| Project | Type | Description |
|---------|------|-------------|
| `client` | Angular app | Browser-based game client |
| `server` | .NET app | SignalR game server (C#) |
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

## Conventions

- Package manager: `npm` (`package-lock.json`)
- Run tasks via Nx: `npx nx <target> <project>`
- Follow conventional commits for Git messages
- Keep components small and focused
