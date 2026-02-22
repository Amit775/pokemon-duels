# .NET Server Guidelines

The server is built with **.NET 10** and **SignalR** for real-time communication.

## Project Structure

```
apps/server/
├── Program.cs              # Entry point, DI configuration
├── Hubs/
│   └── GameHub.cs          # SignalR hub for game events
├── Services/
│   └── GameRoomService.cs  # Room management logic
├── Models/
│   └── GameModels.cs       # Shared DTOs and models
└── Properties/
    └── launchSettings.json # Dev server config
```

## SignalR Hub Pattern

```csharp
public class GameHub : Hub
{
    private readonly GameRoomService _roomService;
    private readonly ILogger<GameHub> _logger;

    public GameHub(GameRoomService roomService, ILogger<GameHub> logger)
    {
        _roomService = roomService;
        _logger = logger;
    }

    // Client-callable methods
    public async Task<JoinResult> CreateRoom() { ... }
    public async Task<JoinResult> JoinRoom(string roomId) { ... }
    
    // Broadcast to room
    await Clients.Group(roomId).SendAsync("GameStateChanged", state);
    
    // Handle disconnection
    public override async Task OnDisconnectedAsync(Exception? exception) { ... }
}
```

## Key Patterns

| Pattern | Description |
|---------|-------------|
| `Hub<T>` | Strongly-typed hub interface |
| `Groups` | Room-based message routing |
| `Clients.Caller` | Send to calling client |
| `Clients.Group(id)` | Broadcast to room |
| `Context.ConnectionId` | Unique client identifier |

## Running the Server

```bash
# Development (hot reload)
pnpm nx serve server

# Build for production
pnpm nx build server

# Deploy to Cloud Run
pnpm nx deploy server
```

## Configuration

- `appsettings.json` - Production config
- `appsettings.Development.json` - Dev overrides
- CORS configured for client origin

## Client Integration

The Angular client connects via `@microsoft/signalr`:

```typescript
const connection = new HubConnectionBuilder()
  .withUrl('https://server-url/gamehub')
  .withAutomaticReconnect()
  .build();

await connection.start();
await connection.invoke('JoinRoom', roomId);

connection.on('GameStateChanged', (state) => { ... });
```
