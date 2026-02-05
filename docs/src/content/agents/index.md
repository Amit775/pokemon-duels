---
title: AI Instructions for Pokemon Duel
slug: index
description: Instructions and context for AI agents helping with this project
category: agents
order: 0
---

# AI Instructions for Pokemon Duel

This section contains instructions and context for AI agents helping with this project.

## Available Documentation

- **Design Details** - Architecture decisions, design discussions, and technical specifications

## Project Overview

**Pokemon Duel** is a multiplayer real-time web board game where 2-6 players can join a room and play together.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Angular 21 (zoneless, signals, modern best practices) |
| Backend | .NET (Minimal APIs) |
| Real-time | SignalR (recommended for .NET ecosystem) |
| Database | Redis + PostgreSQL (production) / SQLite (development) |

### Key Features to Implement

- [ ] Room creation and management (2-6 players)
- [ ] Real-time game state synchronization
- [ ] Turn-based gameplay mechanics
- [ ] Player authentication (TBD)
- [ ] Game board rendering
- [ ] Pokemon selection/management
