---
title: Database Strategy
slug: architecture/database-strategy
description: Database architecture and data models
category: agents
---

# Database Strategy

## Status: DRAFT - Pending Discussion

---

## Data Categories

### 1. Ephemeral Game State (Hot Data)
- Current game board state
- Player positions in rooms
- Active game sessions
- Turn timers

**Characteristics:** Frequently read/written, can be lost on crash, needs sub-millisecond access

### 2. Persistent Data (Cold Data)
- Player accounts/profiles
- Game history/replays
- Statistics/leaderboards
- Achievements

**Characteristics:** Infrequently written, must survive crashes, can tolerate higher latency

---

## Recommended Architecture

### Development Phase: SQLite + In-Memory Cache

Simple setup for rapid development:

```
Angular Client ◄──► .NET Server ◄──► SQLite (single file)
                         │
                         ▼
                   In-Memory Cache
                   (Game State)
```

**Pros:**
- Zero infrastructure needed
- Fast iteration
- Easy to reset/seed data

### Production Phase: Redis + PostgreSQL

```
Angular Client ◄──► .NET Server ◄──┬──► Redis (Game State)
                                   │
                                   └──► PostgreSQL (Persistent)
```

**Pros:**
- Redis: Sub-millisecond game state access
- PostgreSQL: Reliable persistent storage
- Scalable independently

---

## Data Models (Draft)

### Player
```json
{
  "id": "uuid",
  "username": "string",
  "email": "string?",
  "createdAt": "datetime",
  "stats": {
    "gamesPlayed": 0,
    "wins": 0,
    "losses": 0
  }
}
```

### Room
```json
{
  "id": "string (6 chars)",
  "hostPlayerId": "uuid",
  "players": ["uuid"],
  "status": "waiting | playing | finished",
  "maxPlayers": 6,
  "createdAt": "datetime",
  "gameId": "uuid?"
}
```

### Game
```json
{
  "id": "uuid",
  "roomId": "string",
  "players": [
    {
      "playerId": "uuid",
      "position": 0,
      "pokemon": [],
      "score": 0
    }
  ],
  "board": {},
  "currentTurn": "uuid",
  "turnNumber": 1,
  "status": "active | paused | finished",
  "startedAt": "datetime",
  "finishedAt": "datetime?"
}
```

---

## Technology Options

### For Development (Choose One)

| Option | Setup | Best For |
|--------|-------|----------|
| **SQLite + EF Core** | `dotnet add package Microsoft.EntityFrameworkCore.Sqlite` | Quick start, no server needed |
| **LiteDB** | `dotnet add package LiteDB` | NoSQL feel, single file |
| **In-Memory** | Built-in | Prototyping only |

### For Production

| Component | Technology | Why |
|-----------|------------|-----|
| Game State | **Redis** | Fast, pub/sub for real-time |
| Persistence | **PostgreSQL** | Reliable, JSON support |
| Caching | **Redis** | Already there |

---

## Migration Path

1. **Phase 1: Development**
   - SQLite for all data
   - In-memory game state
   - Focus on game logic

2. **Phase 2: Alpha**
   - Add Redis for game state
   - Keep SQLite for persistence
   - Test with real users

3. **Phase 3: Production**
   - Migrate to PostgreSQL
   - Scale Redis cluster
   - Add backup/recovery
