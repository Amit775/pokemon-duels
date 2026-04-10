# .NET Server Rules

The server uses **.NET 10** with **SignalR** for real-time game communication.

## Project Structure

```
apps/server/
├── Program.cs              # Entry point, DI configuration
├── Hubs/GameHub.cs         # SignalR hub
├── Services/               # Business logic services
├── Models/                 # DTOs and models
└── appsettings.json        # Configuration
```

## Conventions

- Hub methods are `async Task` or `async Task<T>` — never `void`
- Use `Context.ConnectionId` to identify clients
- Use `Groups` for room-based routing — never broadcast to all unless truly global
- Use `Clients.Caller` for response to the calling client
- Use `Clients.Group(roomId)` to broadcast to a room
- Always override `OnDisconnectedAsync` to clean up room state
- Services use `ConcurrentDictionary` for thread-safe shared state
- Models use C# `record` types for immutability
- CORS is configured in `Program.cs` — do not add it in other places

## SignalR Client Targeting

| Target | Use for |
|--------|---------|
| `Clients.Caller` | Response to the calling client |
| `Clients.Client(id)` | Specific connection |
| `Clients.Group(roomId)` | All clients in a room |
| `Clients.GroupExcept(roomId, id)` | Room except the caller |
| `Clients.All` | All connected clients (avoid unless necessary) |

## Model Convention

Use `record` types with `required` and `init`:

```csharp
public record GameRoom
{
    public required string RoomId { get; init; }
    public List<Player> Players { get; init; } = [];
}
```

For implementation patterns and commands, invoke the `dotnet` skill.
