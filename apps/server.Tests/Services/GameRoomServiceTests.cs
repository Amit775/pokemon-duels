using Server.Services;
using Server.Models;
using Xunit;

namespace Server.Tests.Services;

public class GameRoomServiceTests
{
    private static Spot MakeSpot(string id, string type, int? playerId = null, double x = 0, double y = 0)
        => new Spot
        {
            Id = id,
            Name = id,
            X = x,
            Y = y,
            Metadata = new SpotMetadata { Type = type, PlayerId = playerId },
        };

    private static Passage MakePassage(string id, string from, string to)
        => new Passage { Id = id, FromSpotId = from, ToSpotId = to, PassageType = "normal" };

    // =========================================================================
    // CreateRoom
    // =========================================================================

    [Fact]
    public void CreateRoom_ReturnsRoomWithValidRoomId()
    {
        var service = new GameRoomService();

        var (room, _) = service.CreateRoom();

        Assert.NotNull(room);
        Assert.NotEmpty(room.RoomId);
        Assert.Equal(4, room.RoomId.Length);
    }

    [Fact]
    public void CreateRoom_TwoRoomsHaveDifferentIds_MostOfTheTime()
    {
        var service = new GameRoomService();
        var ids = new HashSet<string>();
        for (var i = 0; i < 10; i++)
        {
            var (room, _) = service.CreateRoom();
            ids.Add(room.RoomId);
        }
        // With 32^4 = ~1M possibilities, very unlikely all 10 are the same
        Assert.True(ids.Count > 1);
    }

    // =========================================================================
    // JoinRoom
    // =========================================================================

    [Fact]
    public void JoinRoom_Success_ReturnsPlayerId1ForFirstPlayer()
    {
        var service = new GameRoomService();
        var (room, _) = service.CreateRoom();

        var result = service.JoinRoom(room.RoomId, "conn1");

        Assert.True(result.Success);
        Assert.Equal(1, result.AssignedPlayerId);
    }

    [Fact]
    public void JoinRoom_SecondPlayer_ReturnsPlayerId2()
    {
        var service = new GameRoomService();
        var (room, _) = service.CreateRoom();

        service.JoinRoom(room.RoomId, "conn1");
        var result = service.JoinRoom(room.RoomId, "conn2");

        Assert.True(result.Success);
        Assert.Equal(2, result.AssignedPlayerId);
    }

    [Fact]
    public void JoinRoom_RoomNotFound_ReturnsFailure()
    {
        var service = new GameRoomService();

        var result = service.JoinRoom("XXXX", "conn1");

        Assert.False(result.Success);
        Assert.Equal("Room not found", result.Error);
    }

    [Fact]
    public void JoinRoom_RoomFull_ReturnsFailure()
    {
        var service = new GameRoomService();
        var (room, _) = service.CreateRoom();
        service.JoinRoom(room.RoomId, "conn1");
        service.JoinRoom(room.RoomId, "conn2");

        var result = service.JoinRoom(room.RoomId, "conn3");

        Assert.False(result.Success);
        Assert.Equal("Room is full", result.Error);
    }

    [Fact]
    public void JoinRoom_IsCaseInsensitive()
    {
        var service = new GameRoomService();
        var (room, _) = service.CreateRoom();
        var lowerRoomId = room.RoomId.ToLowerInvariant();

        var result = service.JoinRoom(lowerRoomId, "conn1");

        Assert.True(result.Success);
    }

    // =========================================================================
    // GetRoom
    // =========================================================================

    [Fact]
    public void GetRoom_ReturnsRoom_WhenItExists()
    {
        var service = new GameRoomService();
        var (created, _) = service.CreateRoom();

        var found = service.GetRoom(created.RoomId);

        Assert.NotNull(found);
        Assert.Equal(created.RoomId, found!.RoomId);
    }

    [Fact]
    public void GetRoom_ReturnsNull_WhenNotExists()
    {
        var service = new GameRoomService();

        var found = service.GetRoom("ZZZZ");

        Assert.Null(found);
    }

    // =========================================================================
    // GetRoomForConnection
    // =========================================================================

    [Fact]
    public void GetRoomForConnection_ReturnsRoomId_AfterJoin()
    {
        var service = new GameRoomService();
        var (room, _) = service.CreateRoom();
        service.JoinRoom(room.RoomId, "conn1");

        var roomId = service.GetRoomForConnection("conn1");

        Assert.Equal(room.RoomId, roomId);
    }

    [Fact]
    public void GetRoomForConnection_ReturnsNull_WhenNotJoined()
    {
        var service = new GameRoomService();

        var roomId = service.GetRoomForConnection("unknown");

        Assert.Null(roomId);
    }

    // =========================================================================
    // LeaveRoom
    // =========================================================================

    [Fact]
    public void LeaveRoom_RemovesConnectionMapping()
    {
        var service = new GameRoomService();
        var (room, _) = service.CreateRoom();
        service.JoinRoom(room.RoomId, "conn1");

        service.LeaveRoom("conn1");

        Assert.Null(service.GetRoomForConnection("conn1"));
    }

    [Fact]
    public void LeaveRoom_RemovesRoom_WhenLastPlayerLeaves()
    {
        var service = new GameRoomService();
        var (room, _) = service.CreateRoom();
        service.JoinRoom(room.RoomId, "conn1");

        service.LeaveRoom("conn1");

        Assert.Null(service.GetRoom(room.RoomId));
    }

    [Fact]
    public void LeaveRoom_KeepsRoom_WhenOtherPlayerStillInRoom()
    {
        var service = new GameRoomService();
        var (room, _) = service.CreateRoom();
        service.JoinRoom(room.RoomId, "conn1");
        service.JoinRoom(room.RoomId, "conn2");

        service.LeaveRoom("conn1");

        Assert.NotNull(service.GetRoom(room.RoomId));
    }

    [Fact]
    public void LeaveRoom_DoesNotThrow_WhenConnectionUnknown()
    {
        var service = new GameRoomService();
        // Should not throw
        service.LeaveRoom("unknown-connection");
    }
}
