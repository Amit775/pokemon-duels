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
