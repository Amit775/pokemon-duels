---
title: AI Agent Documentation
slug: index
description: Instructions and context for AI agents helping with this project
category: agents
---

# AI Agent Documentation

This section contains documentation for AI agents working on Pokemon Duel.

---

## Sections

### [Architecture](architecture/)
System design, components, and technical foundations.
- [System Overview](architecture/system-overview) - High-level architecture
- [Realtime Multiplayer](architecture/realtime-multiplayer) - SignalR communication
- [Database Strategy](architecture/database-strategy) - Data storage approach

### [Patterns](patterns/)
Development conventions and coding standards.
- [Angular](patterns/angular) - Components, signals, @ngrx/signals, testing

### [Features](features/)
Feature-specific documentation (added as features are built).

### [Decisions](decisions/)
Architecture Decision Records - documenting "why" behind technical choices.

---

## Project Overview

**Pokemon Duel** is a multiplayer real-time web board game where 2-6 players can join a room and play together.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Angular 21 (zoneless, signals, @ngrx/signals) |
| Backend | .NET 10 (Minimal APIs, SignalR) |
| Real-time | SignalR |
| Database | Redis + PostgreSQL (production) / SQLite (development) |

---

## For Agents: Documentation Guidelines

When completing tasks, update or create documentation:

| Situation | Action |
|-----------|--------|
| Modifying existing system | Update relevant doc in `architecture/` or `patterns/` |
| Adding new feature | Create doc in `features/` |
| Making architectural choice | Create doc in `decisions/` |
| Bug fix / minor change | Skip unless architecture-relevant |
