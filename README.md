# Pokemon Duel 🎮

A multiplayer real-time web board game where 2-6 players can join a room and battle with Pokemon!

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | Angular | 21.x (zoneless, signals) |
| Backend | .NET | 9.x (Minimal APIs) |
| Real-time | SignalR | (planned) |
| Database | TBD | See design docs |

## Project Structure

```
pokemon-duel/
├── client/          # Angular frontend
├── server/          # .NET backend
└── docs/            # Documentation site (Analog.js)
    └── src/content/ # Markdown docs for developers, users, AI agents
```

## Getting Started

### Prerequisites

- Node.js 22+ (or Bun)
- .NET 9 SDK
- Git

### Running the Client

```bash
cd client
bun install
bun start
```

The client will be available at `http://localhost:4200`

### Running the Server

```bash
cd server
dotnet run
```

The API will be available at `http://localhost:5000` (or configured port)

## Development

### Client (Angular)

- Uses **zoneless** change detection for better performance
- **Signals** for reactive state management
- **Vitest** for unit testing
- **SCSS** for styling

### Server (.NET)

- **Minimal APIs** for clean, modern endpoint definition
- **SignalR** for real-time communication (planned)

## Documentation

See [ai-instructions/](./ai-instructions/) for:
- Architecture overview
- Real-time multiplayer design
- Database strategy

## License

TBD
