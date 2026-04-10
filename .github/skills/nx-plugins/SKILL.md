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
