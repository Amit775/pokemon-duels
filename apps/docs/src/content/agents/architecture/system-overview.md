---
title: Architecture Overview
slug: architecture/system-overview
description: High-level architecture for Pokemon Duel
category: agents
---

# Architecture Overview

## Status: DRAFT - Pending Discussion

This document outlines the high-level architecture for Pokemon Duel.

---

## System Components

```
┌─────────────────┐     WebSocket/SignalR      ┌─────────────────┐
│                 │◄──────────────────────────►│                 │
│  Angular Client │                            │  .NET Server    │
│   (Browser)     │◄──────────────────────────►│  (Web API)      │
│                 │         REST API           │                 │
└─────────────────┘                            └────────┬────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │    Database     │
                                               │      (TBD)      │
                                               └─────────────────┘
```

---

## Discussion Points

### 1. Real-time Communication

**Options:**
- **SignalR** (Recommended) - Native .NET solution, excellent Angular support
- **WebSockets** (Raw) - More control, more complexity
- **Socket.io** - Requires Node.js, not ideal for .NET stack

**Recommendation:** SignalR
- Built-in reconnection handling
- Automatic transport fallback (WebSocket → SSE → Long Polling)
- Strong typing with TypeScript client
- Hub-based architecture maps well to game rooms

### 2. Database Selection

**Options:**

| Database | Pros | Cons | Best For |
|----------|------|------|----------|
| **Redis** | Blazing fast, pub/sub, TTL | Limited querying, data loss risk | Game state, sessions |
| **PostgreSQL** | ACID, JSON support, mature | Slower for real-time | Persistent data, history |
| **MongoDB** | Flexible schema, fast writes | Consistency concerns | Game logs, player profiles |
| **Hybrid (Redis + PostgreSQL)** | Best of both | More complexity | Production-grade solution |

**Recommendation:** Start with **Redis** for game state + **SQLite/PostgreSQL** for persistent data

### 3. Game State Management

**Questions to answer:**
- Where is the authoritative game state? (Server-side recommended)
- How often do we sync state? (On every action vs. periodic)
- How do we handle disconnections/reconnections?
- How do we prevent cheating?

### 4. Room/Lobby Architecture

**Proposed Flow:**
1. Player creates or joins a room via REST API
2. Server returns room ID + SignalR connection token
3. Player connects to SignalR hub with room ID
4. Server manages room state and broadcasts updates

---

## Open Questions

1. **Authentication:** Anonymous play? OAuth? Custom accounts?
2. **Scalability:** Single server to start? How to scale SignalR?
3. **Game Rules:** What are the actual Pokemon Duel game mechanics?
4. **Persistence:** Do we save game history? Leaderboards?

---

## Next Steps

- [ ] Define game rules and mechanics
- [ ] Decide on database strategy
- [ ] Design API contracts (REST + SignalR events)
- [ ] Create data models for game state
