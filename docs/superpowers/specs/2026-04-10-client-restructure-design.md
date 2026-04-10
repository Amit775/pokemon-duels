# Client Restructure Design

**Date:** 2026-04-10
**Scope:** `apps/client/src/app/`

## Goal

Reorganise the Angular client from a `components/containers` split into feature-based folders, extract a shared `GameBoard` canvas component, restore local hot-seat play, and eliminate dead code and AI-generated section-header comments.

---

## Folder Structure

```
app/
├── game/
│   ├── game-board/          ← shared canvas (rendering only)
│   ├── spot/
│   ├── passage/
│   ├── pokemon/
│   ├── local-game/          ← route: /local
│   └── multiplayer-game/    ← route: /play/:roomId
│
├── board-editor/
│   ├── board-canvas/        ← editor canvas (click-to-add, edit mode)
│   ├── board-controls/      ← editor toolbar
│   └── board-creator/       ← route: /board-creator
│
└── lobby/
    └── lobby/               ← route: /lobby
```

**Rules:**
- If a route loads it, it lives at feature-root level.
- Building blocks used within one feature live alongside their siblings in the same feature folder.
- No `components/` or `pages/` sub-folders — keep flat until the project grows to need them.
- `spot`, `passage`, `pokemon` stay in `game/` for now. If they are ever needed outside `game/`, they move to a `shared/` folder at that point.

---

## Deleted

- `containers/game-board/` — dead code. The `/play` (no room ID) route has no entry point in the UI. The lobby always navigates to `/play/:roomId`. The route entry is removed from `app.routes.ts`.
- `components/bench/` — bench rendering moves inside `game-board`. No longer a standalone component.
- The `/play` route (bare, no room ID) — removed.

---

## `GameBoard` — shared canvas component

`GameBoard` is purely presentational. It renders everything visible on the game screen: board spots, passages, pokemon on board, bench slots (P1 bottom / P2 top) with SVG bridge connectors, valid-target indicators, and the battle toast. It has no knowledge of where state comes from.

### Inputs

| Input | Type | Purpose |
|---|---|---|
| `spots` | `Spot[]` | Board spots |
| `passages` | `Passage[]` | Connections |
| `pokemonOnBoard` | `Pokemon[]` | Pokemon with a `spotId` |
| `player1Bench` | `Pokemon[]` | P1 bench pokemon |
| `player2Bench` | `Pokemon[]` | P2 bench pokemon |
| `selectedPokemonId` | `string \| null` | Highlight selection |
| `validMoveTargets` | `string[]` | Highlight valid moves |
| `currentPlayerId` | `number` | Determines draggability |
| `phase` | `GamePhase` | Gates interaction when `ended` |
| `lastBattle` | `BattleResult \| null` | Battle toast content |
| `isInteractive` | `boolean` | `false` blocks all input (opponent's turn in multiplayer) |

### Outputs

| Output | Payload | Purpose |
|---|---|---|
| `spotClicked` | `Spot` | User clicked a board spot |
| `pokemonClicked` | `Pokemon` | User clicked a pokemon on the board |
| `benchPokemonSelected` | `Pokemon` | User clicked a bench pokemon |
| `dismissBattle` | `void` | User dismissed the battle toast |

### Internals

- Bench slot positions and coordinate-to-percentage conversions are computed inside `GameBoard`. Parents never deal with this math.
- `BenchSlot` type lives in `game/game-board/`.
- `PassageComponent` receives full `Spot` objects for its endpoints — no function-reference inputs for coordinate conversion.

---

## `LocalGamePage`

**Route:** `/local`  
**Data source:** local `GameStore` (in-memory, no server)

- On init: loads board from `localStorage` via `BoardService`. If no board found, renders an empty board (consistent with existing behaviour).
- `isInteractive` is always `true` — both players share the screen, no turn-gating needed.
- Translates `GameBoard` outputs into `GameStore` method calls.
- Owns the battle-toast auto-dismiss: 5s `setTimeout` → `gameStore.clearBattle()`.
- Win overlay: "Player X wins!" + "Play Again" button (calls `resetGame()`).
- No player identity — pure hot-seat.

---

## `MultiplayerGamePage`

**Route:** `/play/:roomId`  
**Data source:** `MultiplayerStore` + `MultiplayerService` (SignalR)

- On init: reads `roomId` from route params; if not already in a room, calls `multiplayerService.joinRoom(roomId)`.
- `isInteractive = isMyTurn` — all `GameBoard` interaction is blocked during opponent's turn.
- Translates `GameBoard` outputs into async `MultiplayerService` calls.
- No auto-dismiss timer — battle state clears when server sends next game state.
- Win overlay: "Victory / Defeat" based on `localPlayerWon` + "Back to Lobby".
- `effect()` navigates to `/lobby` when `roomState === 'idle'`.

---

## Routes

```typescript
{ path: '',            redirectTo: 'lobby', pathMatch: 'full' },
{ path: 'lobby',       loadComponent: () => import('./lobby/lobby/lobby.component') },
{ path: 'local',       loadComponent: () => import('./game/local-game/local-game.component') },
{ path: 'play/:roomId',loadComponent: () => import('./game/multiplayer-game/multiplayer-game.component') },
{ path: 'board-creator',loadComponent: () => import('./board-editor/board-creator/board-creator.component') },
```

App nav adds a "Local Play" link alongside the existing "Play" (lobby) and "Create Board" links.

---

## Code quality

- Remove all section-header comments (`// ====...====`, inline `// Get Pokemon at spot for rendering`, etc.)
- Remove comments that restate what the code already says clearly.
- Keep comments only where logic is non-obvious (e.g. why `isInteractive` is always `true` in local game).
- No new abstractions beyond what this design defines.
