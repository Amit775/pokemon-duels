# Pokemon Duel 🎮

A multiplayer real-time web board game where 2-6 players can join a room and battle with Pokemon!

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | Angular | 21.x (zoneless, signals) |
| Backend | .NET | 10.x (Minimal APIs) |
| Real-time | SignalR | (planned) |
| Database | TBD | See design docs |
| Monorepo | Nx | 22.x |

## Project Structure

```
pokemon-duel/
├── apps/
│   ├── client/      # Angular frontend
│   ├── docs/        # Documentation site (Analog.js)
│   └── server/      # .NET backend
├── libs/            # Shared libraries (future)
├── nx.json          # Nx configuration
└── package.json     # Root dependencies
```

## Getting Started

### Prerequisites

- Node.js 22+
- .NET 10 SDK
- Git

### Install Dependencies

```bash
npm install
```

### Running Applications

Using Nx commands:

```bash
# Start the client (Angular)
npm run client
# or: npx nx serve client

# Start the docs site
npm run docs
# or: npx nx serve docs

# Start the server (.NET)
npm run server
# or: npx nx serve server
```

The client will be available at `http://localhost:4200`
The docs site will be available at `http://localhost:5173`

### Building

```bash
# Build all projects
npm run build

# Build specific project
npx nx build client
npx nx build docs
npx nx build server
```

### Testing

```bash
# Run all tests
npm run test

# Run specific project tests
npx nx test client
npx nx test docs

# Run e2e tests
npm run e2e
npx nx e2e client
```

### Nx Commands

```bash
# View project graph
npm run graph

# Run affected commands (only changed projects)
npm run affected -- -t build
npm run affected -- -t test
```

## Development

### Client (Angular)

- Uses **zoneless** change detection for better performance
- **Signals** for reactive state management
- **Vitest** for unit testing
- **SCSS** for styling
- **Playwright** for e2e testing

### Docs (Analog.js)

- **Analog.js** for Angular-based static site generation
- **Vite** for fast builds and HMR
- **Markdown** content for documentation

### Server (.NET)

- **Minimal APIs** for clean, modern endpoint definition
- **SignalR** for real-time communication (planned)

## Documentation

See `apps/docs/src/content/` for:
- Architecture overview
- Real-time multiplayer design
- Database strategy

## License

TBD
