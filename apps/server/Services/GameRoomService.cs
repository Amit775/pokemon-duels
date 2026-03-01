using System.Collections.Concurrent;
using System.Text.Json;
using Server.Models;

namespace Server.Services;

/// <summary>
/// Manages a single game room with its state
/// </summary>
public class GameRoom
{
    private readonly object _lock = new();
    
    public string RoomId { get; }
    public string State { get; private set; } = "waiting"; // waiting, playing, ended
    public List<string> PlayerConnectionIds { get; } = new();
    public Dictionary<string, int> PlayerIdMap { get; } = new(); // connectionId -> playerId
    
    // Game state
    public List<Spot> Spots { get; private set; } = new();
    public List<Passage> Passages { get; private set; } = new();
    public List<Pokemon> Pokemon { get; private set; } = new();
    public int CurrentPlayerId { get; private set; } = 1;
    public string Phase { get; private set; } = "setup";
    public int? WinnerId { get; private set; }
    public BattleResult? LastBattle { get; private set; }
    public string? SelectedPokemonId { get; private set; }
    public string[] ValidMoveTargets { get; private set; } = Array.Empty<string>();
    
    // Species data for movement calculations
    private static readonly Dictionary<string, int> SpeciesMovement = new()
    {
        { "snorlax", 1 },
        { "venusaur", 1 },
        { "blastoise", 2 },
        { "charizard", 3 }
    };
    
    private static readonly Dictionary<string, string> SpeciesTypes = new()
    {
        { "snorlax", "normal" },
        { "venusaur", "grass" },
        { "blastoise", "water" },
        { "charizard", "fire" }
    };

    public GameRoom(string roomId)
    {
        RoomId = roomId;
    }

    public int AddPlayer(string connectionId)
    {
        lock (_lock)
        {
            if (PlayerConnectionIds.Count >= 2)
                return -1;

            var playerId = PlayerConnectionIds.Count + 1;
            PlayerConnectionIds.Add(connectionId);
            PlayerIdMap[connectionId] = playerId;
            return playerId;
        }
    }

    public int? GetPlayerId(string connectionId)
    {
        lock (_lock)
        {
            return PlayerIdMap.TryGetValue(connectionId, out var id) ? id : null;
        }
    }

    public bool RemovePlayer(string connectionId)
    {
        lock (_lock)
        {
            PlayerConnectionIds.Remove(connectionId);
            PlayerIdMap.Remove(connectionId);
            return PlayerConnectionIds.Count == 0;
        }
    }

    public void InitializeBoard(List<Spot> spots, List<Passage> passages)
    {
        lock (_lock)
        {
            Spots = spots;
            Passages = passages;
            Phase = "playing";
            State = "playing";
            CurrentPlayerId = 1;
            SetupInitialPokemon();
        }
    }

    private void SetupInitialPokemon()
    {
        var benchSpecies = new[] { "venusaur", "blastoise", "charizard" };
        Pokemon = new List<Pokemon>();

        for (var playerId = 1; playerId <= 2; playerId++)
        {
            // Find player's flag spot
            var flagSpot = Spots.FirstOrDefault(s => 
                s.Metadata.Type == "flag" && s.Metadata.PlayerId == playerId);

            // Place Snorlax at flag
            Pokemon.Add(new Pokemon
            {
                Id = $"{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}-{playerId}-snorlax-{Guid.NewGuid():N}",
                SpeciesId = "snorlax",
                PlayerId = playerId,
                SpotId = flagSpot?.Id
            });

            // Add bench Pokemon
            foreach (var species in benchSpecies)
            {
                Pokemon.Add(new Pokemon
                {
                    Id = $"{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}-{playerId}-{species}-{Guid.NewGuid():N}",
                    SpeciesId = species,
                    PlayerId = playerId,
                    SpotId = null
                });
            }
        }
    }

    public void SelectPokemon(string connectionId, string? pokemonId)
    {
        lock (_lock)
        {
            var playerId = GetPlayerId(connectionId);
            if (playerId != CurrentPlayerId || Phase == "ended")
            {
                SelectedPokemonId = null;
                ValidMoveTargets = Array.Empty<string>();
                return;
            }

            LastBattle = null;

            if (pokemonId == null)
            {
                SelectedPokemonId = null;
                ValidMoveTargets = Array.Empty<string>();
                return;
            }

            var pokemon = Pokemon.FirstOrDefault(p => p.Id == pokemonId);
            if (pokemon == null || pokemon.PlayerId != playerId)
            {
                return;
            }

            SelectedPokemonId = pokemonId;
            ValidMoveTargets = CalculateValidMoves(pokemon).ToArray();
        }
    }

    private List<string> CalculateValidMoves(Pokemon pokemon)
    {
        var movement = SpeciesMovement.GetValueOrDefault(pokemon.SpeciesId, 2);
        var ownOccupied = Pokemon.Where(p => p.SpotId != null && p.PlayerId == pokemon.PlayerId)
            .Select(p => p.SpotId!).ToHashSet();
        var enemyOccupied = Pokemon.Where(p => p.SpotId != null && p.PlayerId != pokemon.PlayerId)
            .Select(p => p.SpotId!).ToHashSet();

        if (pokemon.SpotId == null)
        {
            // From bench - find entry spots
            var entrySpots = Spots.Where(s => 
                s.Metadata.Type == "entry" && s.Metadata.PlayerId == pokemon.PlayerId).ToList();
            
            var targets = new HashSet<string>();
            foreach (var entry in entrySpots)
            {
                if (!ownOccupied.Contains(entry.Id))
                {
                    if (!enemyOccupied.Contains(entry.Id))
                        targets.Add(entry.Id);
                    
                    // Can reach spots beyond entry
                    var reachable = FindReachableSpots(entry.Id, movement - 1, ownOccupied, enemyOccupied);
                    foreach (var id in reachable)
                        targets.Add(id);
                }
            }
            return targets.ToList();
        }
        else
        {
            return FindReachableSpots(pokemon.SpotId, movement, ownOccupied, enemyOccupied);
        }
    }

    private List<string> FindReachableSpots(string fromSpotId, int movement, 
        HashSet<string> ownOccupied, HashSet<string> enemyOccupied)
    {
        var reachable = new HashSet<string>();
        var visited = new HashSet<string> { fromSpotId };
        var queue = new Queue<(string spotId, int remaining)>();
        queue.Enqueue((fromSpotId, movement));

        while (queue.Count > 0)
        {
            var (current, remaining) = queue.Dequeue();
            
            var neighbors = GetNeighbors(current);
            foreach (var neighbor in neighbors)
            {
                if (!visited.Contains(neighbor))
                {
                    // Can't pass through own Pokemon
                    if (ownOccupied.Contains(neighbor))
                        continue;

                    // Can attack enemy Pokemon (but can't continue past)
                    if (enemyOccupied.Contains(neighbor))
                    {
                        reachable.Add(neighbor);
                        continue;
                    }

                    // Empty spot - can move there
                    reachable.Add(neighbor);
                    visited.Add(neighbor);

                    if (remaining > 1)
                        queue.Enqueue((neighbor, remaining - 1));
                }
            }
        }

        return reachable.ToList();
    }

    private List<string> GetNeighbors(string spotId)
    {
        return Passages
            .Where(p => p.FromSpotId == spotId || p.ToSpotId == spotId)
            .Select(p => p.FromSpotId == spotId ? p.ToSpotId : p.FromSpotId)
            .ToList();
    }

    public MoveResult MovePokemon(string connectionId, string pokemonId, string targetSpotId)
    {
        lock (_lock)
        {
            var playerId = GetPlayerId(connectionId);
            if (playerId != CurrentPlayerId)
                return new MoveResult { Success = false, GameState = GetState() };

            var pokemon = Pokemon.FirstOrDefault(p => p.Id == pokemonId);
            if (pokemon == null || pokemon.PlayerId != playerId)
                return new MoveResult { Success = false, GameState = GetState() };

            if (!ValidMoveTargets.Contains(targetSpotId))
                return new MoveResult { Success = false, GameState = GetState() };

            BattleResult? battleResult = null;
            var defender = Pokemon.FirstOrDefault(p => p.SpotId == targetSpotId && p.PlayerId != playerId);

            if (defender != null)
            {
                // Battle!
                var targetSpot = Spots.FirstOrDefault(s => s.Id == targetSpotId);
                var defenderOnFlag = targetSpot?.Metadata.Type == "flag";
                battleResult = ExecuteBattle(pokemon, defender, defenderOnFlag);
                LastBattle = battleResult;

                if (battleResult.WinnerId == pokemonId)
                {
                    // Attacker wins
                    UpdatePokemonSpot(defender.Id, null);
                    UpdatePokemonSpot(pokemonId, targetSpotId);
                }
                else
                {
                    // Defender wins
                    UpdatePokemonSpot(pokemonId, null);
                }
            }
            else
            {
                UpdatePokemonSpot(pokemonId, targetSpotId);
            }

            // Check win condition
            var movedPokemon = Pokemon.FirstOrDefault(p => p.Id == pokemonId);
            var opponentFlag = Spots.FirstOrDefault(s => 
                s.Metadata.Type == "flag" && s.Metadata.PlayerId != playerId);

            if (movedPokemon?.SpotId == opponentFlag?.Id)
            {
                Phase = "ended";
                State = "ended";
                WinnerId = playerId;
                SelectedPokemonId = null;
                ValidMoveTargets = Array.Empty<string>();
                
                return new MoveResult 
                { 
                    Success = true, 
                    Battle = battleResult, 
                    Won = true,
                    GameState = GetState() 
                };
            }

            // End turn
            CurrentPlayerId = CurrentPlayerId == 1 ? 2 : 1;
            SelectedPokemonId = null;
            ValidMoveTargets = Array.Empty<string>();

            return new MoveResult 
            { 
                Success = true, 
                Battle = battleResult,
                GameState = GetState() 
            };
        }
    }

    private void UpdatePokemonSpot(string pokemonId, string? newSpotId)
    {
        var index = Pokemon.FindIndex(p => p.Id == pokemonId);
        if (index >= 0)
        {
            var old = Pokemon[index];
            Pokemon[index] = old with { SpotId = newSpotId };
        }
    }

    private BattleResult ExecuteBattle(Pokemon attacker, Pokemon defender, bool defenderOnFlag)
    {
        var random = new Random();
        var attackerRoll = random.Next(1, 7);
        var defenderRoll = random.Next(1, 7);
        
        var attackerType = SpeciesTypes.GetValueOrDefault(attacker.SpeciesId, "normal");
        var defenderType = SpeciesTypes.GetValueOrDefault(defender.SpeciesId, "normal");
        
        var attackerBonus = GetTypeBonus(attackerType, defenderType);
        var defenderBonus = defenderOnFlag && defenderType == "normal" ? 2 : 0;

        var attackerTotal = attackerRoll + attackerBonus;
        var defenderTotal = defenderRoll + defenderBonus;

        var attackerWins = attackerTotal >= defenderTotal; // Attacker wins ties

        return new BattleResult
        {
            AttackerId = attacker.Id,
            DefenderId = defender.Id,
            AttackerRoll = attackerRoll,
            DefenderRoll = defenderRoll,
            AttackerBonus = attackerBonus,
            DefenderBonus = defenderBonus,
            WinnerId = attackerWins ? attacker.Id : defender.Id,
            LoserId = attackerWins ? defender.Id : attacker.Id
        };
    }

    private int GetTypeBonus(string attackerType, string defenderType)
    {
        return (attackerType, defenderType) switch
        {
            ("fire", "grass") => 2,
            ("grass", "water") => 2,
            ("water", "fire") => 2,
            _ => 0
        };
    }

    public GameState GetState()
    {
        lock (_lock)
        {
            return new GameState
            {
                CurrentPlayerId = CurrentPlayerId,
                PlayerCount = 2,
                SelectedPokemonId = SelectedPokemonId,
                ValidMoveTargets = ValidMoveTargets,
                Phase = Phase,
                WinnerId = WinnerId,
                LastBattle = LastBattle,
                Spots = Spots.ToList(),
                Passages = Passages.ToList(),
                Pokemon = Pokemon.ToList()
            };
        }
    }

    public RoomInfo GetRoomInfo()
    {
        lock (_lock)
        {
            return new RoomInfo
            {
                RoomId = RoomId,
                PlayerCount = PlayerConnectionIds.Count,
                Players = PlayerConnectionIds.ToList(),
                State = State
            };
        }
    }
}

/// <summary>
/// Service to manage all game rooms
/// </summary>
public class GameRoomService
{
    private readonly ConcurrentDictionary<string, GameRoom> _rooms = new();
    private readonly ConcurrentDictionary<string, string> _connectionRooms = new(); // connectionId -> roomId

    public (GameRoom room, int playerId) CreateRoom()
    {
        var roomId = GenerateRoomCode();
        var room = new GameRoom(roomId);
        _rooms[roomId] = room;
        return (room, -1);
    }

    public JoinResult JoinRoom(string roomId, string connectionId)
    {
        if (!_rooms.TryGetValue(roomId.ToUpperInvariant(), out var room))
        {
            return new JoinResult
            {
                Success = false,
                Error = "Room not found"
            };
        }

        var playerId = room.AddPlayer(connectionId);
        if (playerId == -1)
        {
            return new JoinResult
            {
                Success = false,
                Error = "Room is full"
            };
        }

        _connectionRooms[connectionId] = room.RoomId;

        return new JoinResult
        {
            Success = true,
            Room = room.GetRoomInfo(),
            AssignedPlayerId = playerId
        };
    }

    public GameRoom? GetRoom(string roomId)
    {
        return _rooms.TryGetValue(roomId.ToUpperInvariant(), out var room) ? room : null;
    }

    public string? GetRoomForConnection(string connectionId)
    {
        return _connectionRooms.TryGetValue(connectionId, out var roomId) ? roomId : null;
    }

    public void LeaveRoom(string connectionId)
    {
        if (_connectionRooms.TryRemove(connectionId, out var roomId))
        {
            if (_rooms.TryGetValue(roomId, out var room))
            {
                if (room.RemovePlayer(connectionId))
                {
                    // Room is empty, remove it
                    _rooms.TryRemove(roomId, out _);
                }
            }
        }
    }

    private static string GenerateRoomCode()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        var random = new Random();
        return new string(Enumerable.Range(0, 4).Select(_ => chars[random.Next(chars.Length)]).ToArray());
    }
}
