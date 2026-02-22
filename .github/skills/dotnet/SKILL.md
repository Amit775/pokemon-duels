---
name: dotnet
description: ".NET and SignalR patterns for the game server. USE WHEN working with the server project, SignalR hubs, C# models, or API endpoints. EXAMPLES: 'add hub method', 'broadcast to room', 'handle connection', '.NET service'."
---

# .NET Server Patterns

The server uses **.NET 10** with **SignalR** for real-time game communication.

## Project Location

```
apps/server/
├── Program.cs              # Entry point, DI setup
├── Hubs/GameHub.cs         # SignalR hub
├── Services/               # Business logic
├── Models/                 # DTOs and models
└── appsettings.json        # Configuration
```

## Running the Server

```bash
# Development with hot reload
pnpm nx serve server

# Build
pnpm nx build server

# Deploy to Cloud Run
pnpm nx deploy server
```

## SignalR Hub Pattern

```csharp
using Microsoft.AspNetCore.SignalR;

public class GameHub : Hub
{
    private readonly GameRoomService _roomService;
    private readonly ILogger<GameHub> _logger;

    public GameHub(GameRoomService roomService, ILogger<GameHub> logger)
    {
        _roomService = roomService;
        _logger = logger;
    }

    // Client-callable method
    public async Task<JoinResult> JoinRoom(string roomId)
    {
        var result = _roomService.JoinRoom(roomId, Context.ConnectionId);
        if (result.Success)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
            _logger.LogInformation("Player {Id} joined {Room}", Context.ConnectionId, roomId);
        }
        return result;
    }

    // Broadcast to all clients in a room
    public async Task SendGameState(string roomId, GameState state)
    {
        await Clients.Group(roomId).SendAsync("GameStateChanged", state);
    }

    // Handle disconnection
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _roomService.HandleDisconnect(Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }
}
```

## SignalR Client Targeting

```csharp
// Send to calling client only
await Clients.Caller.SendAsync("MethodName", data);

// Send to specific connection
await Clients.Client(connectionId).SendAsync("MethodName", data);

// Broadcast to group (room)
await Clients.Group(roomId).SendAsync("MethodName", data);

// Broadcast to group except caller
await Clients.GroupExcept(roomId, Context.ConnectionId).SendAsync("MethodName", data);

// Broadcast to all connected clients
await Clients.All.SendAsync("MethodName", data);
```

## Service Pattern

```csharp
public class GameRoomService
{
    private readonly ConcurrentDictionary<string, GameRoom> _rooms = new();

    public (GameRoom Room, string RoomId) CreateRoom()
    {
        var roomId = GenerateRoomId();
        var room = new GameRoom { RoomId = roomId };
        _rooms.TryAdd(roomId, room);
        return (room, roomId);
    }

    public JoinResult JoinRoom(string roomId, string connectionId)
    {
        if (!_rooms.TryGetValue(roomId, out var room))
            return new JoinResult { Success = false, Error = "Room not found" };
        
        // Add player logic...
        return new JoinResult { Success = true, Room = room };
    }
}
```

## Model/DTO Pattern

```csharp
namespace Server.Models;

public record GameRoom
{
    public required string RoomId { get; init; }
    public List<Player> Players { get; init; } = [];
    public GameState? State { get; set; }
}

public record JoinResult
{
    public bool Success { get; init; }
    public string? Error { get; init; }
    public GameRoom? Room { get; init; }
}
```

## Configuration

`appsettings.json`:
```json
{
  "Logging": {
    "LogLevel": { "Default": "Information" }
  },
  "AllowedHosts": "*"
}
```

CORS is configured in `Program.cs` to allow the Angular client origin.

## Detailed Reference

For more patterns, read `.claude/instructions/dotnet.md`.
