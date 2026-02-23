# ADR: Signal Stores as Single Source of Truth

**Issue:** [#11](https://github.com/Amit775/pokemon-duels/issues/11)
**Status:** Accepted
**Date:** 2026-02-23

## Context

The client architecture has two patterns for managing state:

1. **NgRx signal stores** (`GameStore`, `BoardStore`) — proper centralized state
2. **Service-level raw signals** (`MultiplayerService`) — ad-hoc state mixed with server communication

The `MultiplayerService` currently mixes **two responsibilities**:
- **State management** — holds room/game state via `signal()` + `computed()`
- **Server communication** — handles SignalR calls and event listeners

This means multiplayer state is not managed by a signal store, unlike single-player and board-editor flows. The UI reads state from a service rather than a store, breaking consistency and making the data flow harder to reason about.

## Decision

Adopt NgRx signal stores as the **single source of truth** for all application state. Services become thin communication layers that dispatch state changes to stores.

### Architecture

```
User Action (click)
  → Component calls Service method (server action)
    → SignalR sends message to server
      → Server broadcasts event
        → SignalR event handler fires
          → Store state updated via patchState()
            → Computed signals recalculate
              → UI re-renders
```

**Key principle:** Components **read from stores**, **write through services**. Services never hold state.

### State Ownership

| State | Owner | Scope |
|-------|-------|-------|
| Single-player game | `GameStore` | Component-scoped |
| Board editor | `BoardStore` | Component-scoped |
| Multiplayer room + game | `MultiplayerStore` (new) | Root-scoped |
| SignalR connection | `SignalRService` | Root-scoped (transport only) |

## Implementation Plan

### Step 1: Create `multiplayer.types.ts`

**New file:** `libs/board/src/lib/store/multiplayer.types.ts`

Extract type definitions from `MultiplayerService`:
- `RoomInfo`, `JoinResult`, `MultiplayerGameState`, `MoveResult`, `RoomState`
- `MultiplayerState` (new aggregate state type for the store)

### Step 2: Create `MultiplayerStore` (NgRx signal store)

**New file:** `libs/board/src/lib/store/multiplayer.store.ts`

An NgRx signal store provided at root scope containing:

**State:**
- `roomState` — `'idle' | 'creating' | 'joining' | 'waiting' | 'playing' | 'ended'`
- `roomInfo` — room metadata from server
- `localPlayerId` — this client's player number
- `error` — error messages
- `gameState` — full game state from server

**Computed signals:**
- Room: `roomCode`, `isHost`, `opponentConnected`, `isLoading`, `isWaiting`, `isInRoom`
- Game: `spots`, `passages`, `pokemon`, `currentPlayerId`, `selectedPokemonId`, `validMoveTargets`, `phase`, `winnerId`, `lastBattle`
- Turn: `isMyTurn`

**Methods:**
- `setRoomState()`, `setRoomInfo()`, `setLocalPlayerId()`, `setError()`, `setGameState()`
- `playerLeft()` — decrement player count
- `reset()` — clear all state to idle

### Step 3: Refactor `MultiplayerService` to thin communication layer

**Modified file:** `libs/board/src/lib/services/multiplayer.service.ts`

- Remove all `signal()` and `computed()` state
- Inject `MultiplayerStore` for state mutations
- SignalR event handlers call store methods instead of setting local signals
- Action methods (`createRoom`, `joinRoom`, `movePokemon`, etc.) remain as public API
- Remove helper methods (`getPokemonAtSpot`, etc.) — become store computeds or stay in components

### Step 4: Update `LobbyComponent`

**Modified file:** `apps/client/src/app/containers/lobby/lobby.component.ts`

- Inject `MultiplayerStore` for reading state
- Keep `MultiplayerService` for actions only
- Read `roomState`, `roomCode`, `error`, etc. from store

### Step 5: Update `MultiplayerGameComponent`

**Modified file:** `apps/client/src/app/containers/multiplayer-game/multiplayer-game.component.ts`

- Inject `MultiplayerStore` for reading all game state
- Keep `MultiplayerService` for server actions only
- Component-local computeds (`spotMap`, `playerBenches`, `localPlayerWon`) stay in component

### Step 6: Update exports

**Modified file:** `libs/board/src/index.ts`

Export `MultiplayerStore` and `multiplayer.types`.

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `libs/board/src/lib/store/multiplayer.types.ts` | **Create** | Type definitions extracted from service |
| `libs/board/src/lib/store/multiplayer.store.ts` | **Create** | NgRx signal store for multiplayer state |
| `libs/board/src/lib/services/multiplayer.service.ts` | **Modify** | Strip state, keep only server communication |
| `libs/board/src/index.ts` | **Modify** | Export new store and types |
| `apps/client/src/app/containers/lobby/lobby.component.ts` | **Modify** | Read from store, actions through service |
| `apps/client/src/app/containers/multiplayer-game/multiplayer-game.component.ts` | **Modify** | Read from store, actions through service |

## What Stays the Same

- **`GameStore`** — already an NgRx signal store for single-player ✅
- **`BoardStore`** — already an NgRx signal store for board editor ✅
- **`SignalRService`** — pure transport layer, connection state signals are appropriate ✅
- **All presentational components** — already use signal inputs/outputs ✅
- **Server (.NET)** — no server changes needed ✅

## Consequences

**Positive:**
- Consistent state management pattern across the entire client
- Clear separation: stores own state, services handle I/O
- Predictable data flow: server event → store → UI
- Easier debugging — all state lives in stores with clear mutation points

**Negative:**
- Additional indirection layer (service → store → component)
- More files to maintain (types file + store file)

## Alternatives Considered

1. **Keep raw signals in service** — rejected because it breaks consistency with `GameStore`/`BoardStore` and mixes concerns
2. **Merge into `GameStore`** — rejected because multiplayer and single-player have different lifecycles (root vs component scope)
