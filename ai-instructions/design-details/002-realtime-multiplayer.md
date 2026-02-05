# Real-time Multiplayer Architecture

## Status: DRAFT - Pending Discussion

---

## Recommended Approach: SignalR

SignalR is the recommended solution for real-time communication in this .NET + Angular stack.

### Why SignalR?

1. **Native .NET Integration** - First-class support in ASP.NET Core
2. **TypeScript Client** - `@microsoft/signalr` npm package with full typing
3. **Automatic Reconnection** - Built-in retry logic
4. **Transport Fallback** - WebSocket → Server-Sent Events → Long Polling
5. **Hub Pattern** - Natural fit for game rooms
6. **Scalability** - Azure SignalR Service for production scaling

---

## Architecture Design

### Hub Structure

```csharp
// Proposed Hub structure
public class GameHub : Hub
{
    // Room Management
    Task CreateRoom(string playerName) -> RoomCreated
    Task JoinRoom(string roomId, string playerName) -> PlayerJoined
    Task LeaveRoom() -> PlayerLeft
    
    // Game Flow
    Task StartGame() -> GameStarted
    Task MakeMove(MoveData move) -> MoveMade
    Task EndTurn() -> TurnEnded
    
    // Communication
    Task SendMessage(string message) -> MessageReceived
}
```

### Client-Side Service (Angular)

```typescript
// Proposed Angular service structure
@Injectable({ providedIn: 'root' })
export class GameHubService {
  private hubConnection: HubConnection;
  
  // Observables for game events
  readonly playerJoined$ = signal<Player | null>(null);
  readonly gameState$ = signal<GameState | null>(null);
  readonly messages$ = signal<ChatMessage[]>([]);
  
  // Methods
  async connect(roomId: string): Promise<void>;
  async createRoom(playerName: string): Promise<string>;
  async joinRoom(roomId: string, playerName: string): Promise<void>;
  async makeMove(move: Move): Promise<void>;
}
```

---

## State Synchronization Strategy

### Option A: Event Sourcing (Recommended)
- Server broadcasts individual events (PlayerMoved, CardPlayed, etc.)
- Clients apply events to local state
- Full state sync on reconnection

### Option B: Full State Broadcast
- Server sends complete game state on every change
- Simpler but more bandwidth

### Recommendation: Hybrid Approach
- Broadcast events during normal gameplay
- Send full state on:
  - Initial connection
  - Reconnection
  - Client requests sync

---

## Handling Edge Cases

### Player Disconnection
```
1. SignalR detects disconnect (OnDisconnectedAsync)
2. Start grace period timer (30 seconds?)
3. Notify other players: "Player X disconnected, waiting..."
4. If reconnects: restore to game
5. If timeout: handle as forfeit or AI takeover
```

### Network Latency
- Use optimistic UI updates for better UX
- Server validates and corrects if needed
- Timestamp all events for ordering

### Cheating Prevention
- Server is authoritative for all game logic
- Client only sends intents, not state changes
- Validate all moves server-side
- Rate limit actions

---

## Implementation Steps

1. **Server Setup**
   - [ ] Add SignalR package to .NET project
   - [ ] Create GameHub class
   - [ ] Configure CORS for Angular dev server
   - [ ] Implement room management

2. **Client Setup**
   - [ ] Install `@microsoft/signalr` package
   - [ ] Create GameHubService with signals
   - [ ] Implement connection lifecycle
   - [ ] Create reconnection logic

3. **Testing**
   - [ ] Unit test hub methods
   - [ ] Integration test with multiple clients
   - [ ] Test reconnection scenarios

---

## Packages to Install

### Server (.NET)
```xml
<PackageReference Include="Microsoft.AspNetCore.SignalR" />
```

### Client (Angular)
```bash
bun add @microsoft/signalr
```

---

## Resources

- [ASP.NET Core SignalR Documentation](https://docs.microsoft.com/aspnet/core/signalr)
- [SignalR JavaScript Client](https://docs.microsoft.com/aspnet/core/signalr/javascript-client)
- [Azure SignalR Service](https://azure.microsoft.com/services/signalr-service/)
