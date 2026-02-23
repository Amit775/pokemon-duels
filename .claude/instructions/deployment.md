# Deployment Guidelines

## Overview

| Component | Platform | Config |
|-----------|----------|--------|
| Client | Firebase Hosting | `firebase.json` |
| Server | Google Cloud Run | `cloudbuild.yaml`, `Dockerfile` |

## Firebase Hosting (Client)

### Configuration

`firebase.json`:
```json
{
  "hosting": {
    "public": "dist/apps/client/browser",
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  }
}
```

### Deploy Commands

```bash
# Build for production
npx nx build client --configuration=production

# Deploy to Firebase
npx nx deploy client

# Or manually
firebase deploy --only hosting
```

### Setup

```bash
# Login to Firebase
npm run firebase:login
# or: firebase login

# Initialize (if needed)
firebase init hosting
```

## Google Cloud Run (Server)

### Dockerfile

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY . .
RUN dotnet publish -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .
EXPOSE 8080
ENTRYPOINT ["dotnet", "Server.dll"]
```

### Deploy Commands

```bash
# Deploy via Nx
npx nx deploy server

# Or via Cloud Build
gcloud builds submit --config=cloudbuild.yaml
```

### Setup

```bash
# Login to GCP
npm run gcloud:login
# or: gcloud auth login

# Set project
gcloud config set project <project-id>
```

## CI/CD

### Cloud Build (`cloudbuild.yaml`)

Triggers on push to `main` or `deploy` branch:
1. Build client → Deploy to Firebase
2. Build server → Deploy to Cloud Run

### Environment Variables

| Variable | Location | Purpose |
|----------|----------|---------|
| `FIREBASE_TOKEN` | Cloud Build secrets | Firebase CLI auth |
| Server URL | `environment.prod.ts` | Client → Server connection |

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Development, PRs merge here |
| `deploy` | Production deployments |
