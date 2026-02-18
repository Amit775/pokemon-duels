namespace Server.Models;

/// <summary>
/// Represents a spot on the game board
/// </summary>
public record SpotMetadata
{
    public required string Type { get; init; }
    public int? PlayerId { get; init; }
}

public record Spot
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    public required double X { get; init; }
    public required double Y { get; init; }
    public required SpotMetadata Metadata { get; init; }
}

/// <summary>
/// Represents a passage between two spots
/// </summary>
public record Passage
{
    public required string Id { get; init; }
    public required string FromSpotId { get; init; }
    public required string ToSpotId { get; init; }
    public required string PassageType { get; init; }
}

/// <summary>
/// Represents a Pokemon on the board
/// </summary>
public record Pokemon
{
    public required string Id { get; init; }
    public required string SpeciesId { get; init; }
    public required int PlayerId { get; init; }
    public string? SpotId { get; init; }
}

/// <summary>
/// Represents results of a battle
/// </summary>
public record BattleResult
{
    public required string AttackerId { get; init; }
    public required string DefenderId { get; init; }
    public required int AttackerRoll { get; init; }
    public required int DefenderRoll { get; init; }
    public required int AttackerBonus { get; init; }
    public required int DefenderBonus { get; init; }
    public required string WinnerId { get; init; }
    public required string LoserId { get; init; }
}

/// <summary>
/// Full game state for synchronization
/// </summary>
public record GameState
{
    public required int CurrentPlayerId { get; init; }
    public required int PlayerCount { get; init; }
    public string? SelectedPokemonId { get; init; }
    public required string[] ValidMoveTargets { get; init; }
    public required string Phase { get; init; }
    public int? WinnerId { get; init; }
    public BattleResult? LastBattle { get; init; }
    public required List<Spot> Spots { get; init; }
    public required List<Passage> Passages { get; init; }
    public required List<Pokemon> Pokemon { get; init; }
}

/// <summary>
/// Player action to move a Pokemon
/// </summary>
public record MoveAction
{
    public required string PokemonId { get; init; }
    public required string TargetSpotId { get; init; }
}

/// <summary>
/// Result of a move action
/// </summary>
public record MoveResult
{
    public required bool Success { get; init; }
    public BattleResult? Battle { get; init; }
    public bool Won { get; init; }
    public required GameState GameState { get; init; }
}

/// <summary>
/// Player action to select a Pokemon
/// </summary>
public record SelectAction
{
    public string? PokemonId { get; init; }
}

/// <summary>
/// Room information
/// </summary>
public record RoomInfo
{
    public required string RoomId { get; init; }
    public required int PlayerCount { get; init; }
    public required List<string> Players { get; init; }
    public required string State { get; init; } // "waiting", "playing", "ended"
}

/// <summary>
/// Join room result
/// </summary>
public record JoinResult
{
    public required bool Success { get; init; }
    public string? Error { get; init; }
    public RoomInfo? Room { get; init; }
    public int? AssignedPlayerId { get; init; }
}
