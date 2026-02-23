# Nx Workspace Guidelines

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Run nx commands via npx: `npx nx <command>`
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

## Common Commands

```bash
# Serve applications
npx nx serve client      # Angular client on :4200
npx nx serve server      # .NET server on :5000
npx nx serve docs        # Docs site on :5173

# Build
npx nx build client --configuration=production
npx nx run-many -t build

# Test
npx nx test board        # Unit tests for board library
npx nx e2e client        # Playwright e2e tests

# Lint
npx nx lint client
npx nx affected -t lint  # Only affected projects

# Deploy
npx nx deploy client     # Firebase Hosting
npx nx deploy server     # Cloud Run
```

## Project Graph

Use `npx nx graph` to visualize project dependencies.
