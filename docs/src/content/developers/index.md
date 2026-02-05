---
title: Developer Guide
slug: index
description: Getting started guide for developers
category: developers
order: 0
---

# Developer Guide

Welcome to the Pokemon Duel developer documentation.

## Getting Started

### Prerequisites

- Node.js 20+
- .NET 8 SDK
- Your favorite IDE (VS Code recommended)

### Project Structure

```
pokemon-duel/
├── client/          # Angular 21 frontend
├── server/          # .NET Minimal API backend
└── docs/            # This documentation (Analog.js)
```

### Running Locally

**Start the server:**
```bash
cd server
dotnet run
```

**Start the client:**
```bash
cd client
npm install
npm run dev
```

## Architecture

See the [Architecture Overview](/guides/agents/001-architecture-overview) for detailed system design.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Angular 21 (signals, zoneless) |
| Backend | .NET 8 Minimal APIs |
| Real-time | SignalR |
| Database | SQLite (dev) / PostgreSQL + Redis (prod) |
