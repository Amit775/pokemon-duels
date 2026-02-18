using Microsoft.AspNetCore.SignalR;
using Server.Models;
using Server.Services;
using System.Text.Json;

namespace Server.Hubs;

/// <summary>
/// SignalR hub for real-time game communication
/// </summary>
public class GameHub : Hub
{
    private readonly GameRoomService _roomService;
    private readonly ILogger<GameHub> _logger;
    
    // Board is loaded from static file at startup
    private static List<Spot>? _defaultBoardSpots;
    private static List<Passage>? _defaultBoardPassages;
    
    public static void LoadDefaultBoard(string boardJson)
    {
        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var board = JsonSerializer.Deserialize<BoardJson>(boardJson, options);
        if (board != null)
        {
            _defaultBoardSpots = board.Spots;
            _defaultBoardPassages = board.Passages;
        }
    }

    public GameHub(GameRoomService roomService, ILogger<GameHub> logger)
    {
        _roomService = roomService;
        _logger = logger;
    }

    /// <summary>
    /// Create a new game room and join it
    /// </summary>
    public async Task<JoinResult> CreateRoom()
    {
        var (room, _) = _roomService.CreateRoom();
        var joinResult = _roomService.JoinRoom(room.RoomId, Context.ConnectionId);
        
        if (joinResult.Success)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, room.RoomId);
            _logger.LogInformation("Player {ConnectionId} created and joined room {RoomId}", 
                Context.ConnectionId, room.RoomId);
        }
        
        return joinResult;
    }

    /// <summary>
    /// Join an existing room
    /// </summary>
    public async Task<JoinResult> JoinRoom(string roomId)
    {
        var result = _roomService.JoinRoom(roomId, Context.ConnectionId);
        
        if (result.Success)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, roomId.ToUpperInvariant());
            _logger.LogInformation("Player {ConnectionId} joined room {RoomId} as Player {PlayerId}", 
                Context.ConnectionId, roomId, result.AssignedPlayerId);
            
            // Notify other players
            await Clients.OthersInGroup(roomId.ToUpperInvariant())
                .SendAsync("PlayerJoined", result.Room);
            
            // If room is full, start the game
            if (result.Room?.PlayerCount == 2)
            {
                await StartGame(roomId.ToUpperInvariant());
            }
        }
        
        return result;
    }

    /// <summary>
    /// Start the game with the default board
    /// </summary>
    private async Task StartGame(string roomId)
    {
        var room = _roomService.GetRoom(roomId);
        if (room == null || _defaultBoardSpots == null || _defaultBoardPassages == null)
            return;

        room.InitializeBoard(_defaultBoardSpots, _defaultBoardPassages);
        
        _logger.LogInformation("Game started in room {RoomId}", roomId);
        
        await Clients.Group(roomId).SendAsync("GameStarted", room.GetState());
    }

    /// <summary>
    /// Select a Pokemon
    /// </summary>
    public async Task SelectPokemon(string? pokemonId)
    {
        var roomId = _roomService.GetRoomForConnection(Context.ConnectionId);
        if (roomId == null) return;

        var room = _roomService.GetRoom(roomId);
        if (room == null) return;

        room.SelectPokemon(Context.ConnectionId, pokemonId);
        
        // Broadcast updated state to all players
        await Clients.Group(roomId).SendAsync("GameStateUpdated", room.GetState());
    }

    /// <summary>
    /// Move a Pokemon
    /// </summary>
    public async Task MovePokemon(string pokemonId, string targetSpotId)
    {
        var roomId = _roomService.GetRoomForConnection(Context.ConnectionId);
        if (roomId == null) return;

        var room = _roomService.GetRoom(roomId);
        if (room == null) return;

        var result = room.MovePokemon(Context.ConnectionId, pokemonId, targetSpotId);
        
        if (result.Success)
        {
            _logger.LogInformation("Player moved Pokemon {PokemonId} to {SpotId} in room {RoomId}", 
                pokemonId, targetSpotId, roomId);
            
            // Broadcast the result to all players
            await Clients.Group(roomId).SendAsync("MoveMade", result);
            
            if (result.Won)
            {
                await Clients.Group(roomId).SendAsync("GameEnded", room.GetState());
            }
        }
    }

    /// <summary>
    /// Leave the current room
    /// </summary>
    public async Task LeaveRoom()
    {
        var roomId = _roomService.GetRoomForConnection(Context.ConnectionId);
        if (roomId != null)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomId);
            _roomService.LeaveRoom(Context.ConnectionId);
            
            // Notify remaining players
            await Clients.Group(roomId).SendAsync("PlayerLeft", roomId);
            
            _logger.LogInformation("Player {ConnectionId} left room {RoomId}", 
                Context.ConnectionId, roomId);
        }
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await LeaveRoom();
        await base.OnDisconnectedAsync(exception);
    }
}

// Helper class for JSON deserialization
internal record BoardJson
{
    public required List<Spot> Spots { get; init; }
    public required List<Passage> Passages { get; init; }
}
