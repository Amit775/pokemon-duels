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
