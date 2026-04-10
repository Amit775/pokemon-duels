# Deployment Rules

## What Deploys Where

| Component | Platform | Trigger |
|-----------|----------|---------|
| Client (Angular) | Firebase Hosting | Push to `release/*` |
| Server (.NET) | Google Cloud Run | Push to `release/*` |

## Branch Strategy

| Branch | Purpose | Deploys |
|--------|---------|---------|
| `main` | Development integration | No |
| `release/*` | Production cuts (e.g. `release/1.0`) | Yes — both Firebase + Cloud Run |

**Never merge feature branches directly to `release/*`.** Always merge to `main` first, then cut a release branch.

## Configuration Files

| File | Controls |
|------|---------|
| `firebase.json` | Firebase Hosting: public dir, rewrites, cache headers |
| `cloudbuild.yaml` | GCP Cloud Build pipeline steps |
| `Dockerfile` | .NET server container image |

## Environment Variables

| Variable | Location | Purpose |
|----------|----------|---------|
| `FIREBASE_TOKEN` | Cloud Build secrets | Firebase CLI auth in CI |
| Server URL | `environment.prod.ts` | Client → server connection |

For deploy commands and troubleshooting, invoke the `firebase` skill.
