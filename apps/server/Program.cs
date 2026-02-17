using Server.Hubs;
using Server.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddOpenApi();
builder.Services.AddSignalR();
builder.Services.AddSingleton<GameRoomService>();

// Configure CORS for local development
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:4200", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Load default board
var boardPath = Path.Combine(app.Environment.ContentRootPath, "..", "..", "board.json");
if (File.Exists(boardPath))
{
    var boardJson = await File.ReadAllTextAsync(boardPath);
    GameHub.LoadDefaultBoard(boardJson);
    Console.WriteLine($"Loaded board from {boardPath}");
}
else
{
    Console.WriteLine($"WARNING: Board not found at {boardPath}");
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors();
app.UseHttpsRedirection();

// Map SignalR hub
app.MapHub<GameHub>("/gamehub");

// Health check endpoint
app.MapGet("/health", () => Results.Ok(new { Status = "Healthy", Timestamp = DateTime.UtcNow }))
   .WithName("HealthCheck");

app.Run();

