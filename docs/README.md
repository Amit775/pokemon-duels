# Pokemon Duel Documentation

Analog.js-powered documentation site serving guides for developers, users, and AI agents.

## Structure

```
src/content/
├── agents/           # AI agent instructions
│   ├── index.md
│   ├── 001-architecture-overview.md
│   ├── 002-realtime-multiplayer.md
│   └── 003-database-strategy.md
├── developers/       # Developer guides
│   └── index.md
└── users/            # User guides
    └── index.md
```

## Development

```bash
npm install
npm run dev
```

Navigate to http://localhost:5173

## Build

```bash
npm run build
```

## Adding Documentation

1. Create a markdown file in the appropriate `src/content/` subfolder
2. Add frontmatter with required fields:

```markdown
---
title: Your Document Title
slug: your-slug
description: Brief description
category: developers | users | agents
order: 1
---

# Content here
```

3. The document will automatically appear in the navigation

## Community

- Visit and Star the [GitHub Repo](https://github.com/analogjs/analog)
- Join the [Discord](https://chat.analogjs.org)
