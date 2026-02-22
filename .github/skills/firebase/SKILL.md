---
name: firebase
description: "Firebase Hosting deployment for the Angular client. USE WHEN deploying the client, configuring hosting, or troubleshooting Firebase issues. EXAMPLES: 'deploy to firebase', 'setup hosting', 'firebase config', 'rewrites'."
---

# Firebase Hosting

The Angular client deploys to **Firebase Hosting**.

## Configuration

`firebase.json`:
```json
{
  "hosting": {
    "public": "dist/apps/client/browser",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      }
    ]
  }
}
```

## Deploy Commands

```bash
# Build for production first
pnpm nx build client --configuration=production

# Deploy via Nx target
pnpm nx deploy client

# Or deploy directly with Firebase CLI
firebase deploy --only hosting
```

## Setup / Login

```bash
# Login to Firebase (browser auth)
firebase login
# or use npm script:
pnpm firebase:login

# Check current project
firebase projects:list

# Use specific project
firebase use <project-id>

# Initialize hosting (if not configured)
firebase init hosting
```

## Troubleshooting

### "Not logged in" error
```bash
firebase login --reauth
```

### Wrong project
```bash
firebase use <correct-project-id>
```

### Build artifacts not found
Ensure build completed successfully:
```bash
pnpm nx build client --configuration=production
ls dist/apps/client/browser  # Should have index.html
```

### Deploy preview (without affecting production)
```bash
firebase hosting:channel:deploy preview
```

## CI/CD Integration

In CI (Cloud Build), use a service account token:
```bash
firebase deploy --token "$FIREBASE_TOKEN" --only hosting
```

The token is stored in Cloud Build secrets.

## Common firebase.json Options

| Option | Purpose |
|--------|---------|
| `public` | Directory to deploy |
| `rewrites` | SPA routing (all paths → index.html) |
| `headers` | Cache headers for static assets |
| `redirects` | URL redirects |
| `cleanUrls` | Remove .html extension from URLs |

## Detailed Reference

For deployment workflow, read `.claude/instructions/deployment.md`.
