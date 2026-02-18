using Server.Hubs;
using Server.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddOpenApi();
builder.Services.AddSignalR();
builder.Services.AddSingleton<GameRoomService>();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        var allowedOrigins = builder.Environment.IsDevelopment()
            ? new[] { "http://localhost:4200", "http://localhost:3000" }
            : new[] { "https://pokemon-duels.web.app", "https://pokemon-duels.firebaseapp.com" };
        
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Load default board - check multiple locations
var boardPaths = new[] {
    Path.Combine(app.Environment.ContentRootPath, "board.json"),  // Production: same directory
    Path.Combine(app.Environment.ContentRootPath, "..", "..", "board.json")  // Development: workspace root
};

foreach (var boardPath in boardPaths)
{
    if (File.Exists(boardPath))
    {
        var boardJson = await File.ReadAllTextAsync(boardPath);
        GameHub.LoadDefaultBoard(boardJson);
        Console.WriteLine($"Loaded board from {boardPath}");
        break;
    }
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

