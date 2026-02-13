# Plan: Dockerize Development Environment

## Goal

Containerize the volunteer-hub application so that the backend (and optionally a Flutter web build) can be started with a single command, with consistent behavior across developer machines.

---

## Scope & Constraints

- **Backend (webapi)**: Bun.js + Elysia + SQLite — straightforward to containerize.
- **Frontend (ui)**: Flutter mobile app. Mobile development requires emulators/physical devices, which don't work inside containers. The plan supports two options for Flutter:
  1. Run Flutter natively on the host, pointing at the containerized backend (recommended for day-to-day mobile development).
  2. Build and serve Flutter **web** inside a container for quick browser-based testing.
- **Database**: SQLite is file-based — needs a Docker volume for persistence across container restarts.
- **No external services** (Postgres, Redis, etc.) are needed — SQLite is embedded.

---

## Files to Create

| File | Purpose |
|---|---|
| `webapi/Dockerfile` | Multi-stage Dockerfile for the backend (dev + production targets) |
| `ui/Dockerfile` | Dockerfile for Flutter web build (optional, for browser testing) |
| `docker-compose.yml` | Orchestrates services, volumes, networking |
| `docker-compose.override.yml` | Dev-specific overrides (hot reload, source mounts) |
| `.dockerignore` | Root-level ignore file for Docker context |
| `webapi/.dockerignore` | Backend-specific ignore (node_modules, database files, .env) |

---

## Step-by-step Plan

### Step 1: Create `webapi/Dockerfile`

Multi-stage build with two targets:

**Stage `dev`** (default for docker-compose):
- Base image: `oven/bun:1` (official Bun image, Debian-based)
- Set `WORKDIR /app`
- Copy `package.json` and `bun.lock` first (layer caching for deps)
- Run `bun install`
- Copy remaining source code
- Expose port 3000
- CMD: `bun run dev` (uses `--hot` for hot reload)

**Stage `production`**:
- Same base, install production deps only (`bun install --production`)
- Copy source and build (`bun run build`)
- Use a smaller runtime stage with just the built output
- CMD: `bun run start`

### Step 2: Create `ui/Dockerfile` (optional Flutter web)

- Base image: a Flutter SDK image (e.g., `ghcr.io/cirruslabs/flutter:stable` or `instrumentisto/flutter:stable`)
- Copy `pubspec.yaml` and `pubspec.lock`, run `flutter pub get`
- Copy source code
- Run `flutter build web`
- Serve the built output with a lightweight HTTP server (e.g., `dhttpd` or copy into an `nginx:alpine` stage)
- Expose port 8080

This is **optional** — only useful for quick browser testing. Mobile developers will continue running Flutter natively.

### Step 3: Create `docker-compose.yml`

```yaml
services:
  webapi:
    build:
      context: ./webapi
      target: dev
    ports:
      - "${PORT:-3000}:3000"
    environment:
      - NODE_ENV=development
      - JWT_SECRET=${JWT_SECRET:-dev-secret-key-minimum-32-characters-long}
      - DATABASE_PATH=/app/database/volunteer-hub.db
      - LOG_LEVEL=${LOG_LEVEL:-debug}
    volumes:
      - ./webapi/src:/app/src          # Source mount for hot reload
      - ./webapi/migrations:/app/migrations
      - webapi-db:/app/database        # Named volume for SQLite persistence
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/v1/health"]
      interval: 10s
      timeout: 5s
      retries: 3

  # Optional: Flutter web build for browser testing
  ui-web:
    build:
      context: ./ui
    ports:
      - "8080:80"
    depends_on:
      webapi:
        condition: service_healthy
    profiles:
      - web  # Only starts with: docker compose --profile web up

volumes:
  webapi-db:
```

Key design decisions:
- **Source mounts** (`./webapi/src:/app/src`) enable hot reload without rebuilding the container.
- **Named volume** (`webapi-db`) persists SQLite data across `docker compose down` / `up` cycles.
- **Default JWT_SECRET** set for development convenience — production must override.
- **Health check** hits the existing `/api/v1/health` endpoint.
- **Flutter web uses a profile** (`--profile web`) so it doesn't start by default, since most developers will run Flutter natively.

### Step 4: Create `docker-compose.override.yml`

Dev-specific overrides that are auto-loaded by `docker compose`:

```yaml
services:
  webapi:
    # Enable Bun debug port
    ports:
      - "3000:3000"
      - "6499:6499"  # Bun debugger
    environment:
      - LOG_LEVEL=debug
```

### Step 5: Create `.dockerignore` files

**Root `.dockerignore`**:
```
.git
*.md
plans/
LICENSE
.github/
```

**`webapi/.dockerignore`**:
```
node_modules/
dist/
out/
database/
*.db
*.db-shm
*.db-wal
.env
.env.*.local
coverage/
logs/
.eslintcache
.cache
```

### Step 6: Create database migration entrypoint

Add an `entrypoint.sh` script in `webapi/` that:
1. Runs migrations (`bun run migrate`)
2. Then starts the application (`exec "$@"` to hand off to CMD)

This ensures the database schema is always up to date when the container starts.

```bash
#!/bin/sh
set -e
echo "Running database migrations..."
bun run migrate
echo "Starting application..."
exec "$@"
```

The Dockerfile will `COPY entrypoint.sh` and set `ENTRYPOINT ["./entrypoint.sh"]`.

### Step 7: Update documentation

Add a **Docker** section to the root `README.md` with:

```bash
# Start backend only (most common for development)
docker compose up

# Start backend + Flutter web
docker compose --profile web up

# Rebuild after dependency changes
docker compose build

# Reset database
docker compose down -v   # removes named volumes

# View logs
docker compose logs -f webapi
```

---

## Network & Service Communication

- The Flutter mobile app (running natively on the host or emulator) connects to the backend at `http://localhost:3000`.
- The Flutter web build (inside Docker, if used) connects to the backend via Docker networking at `http://webapi:3000` — this will require the `ui/lib/config/env.dart` API base URL to be configurable (it likely already is via `EnvConfig`).
- No reverse proxy is needed for development.

---

## What This Plan Does NOT Include

- **Production deployment** (Kubernetes, cloud hosting) — out of scope.
- **Flutter mobile in Docker** — impractical without GPU/emulator passthrough.
- **CI/CD Docker builds** — the GitHub Actions workflows already exist; Docker CI images can be added later.
- **Nginx reverse proxy** — not needed for local development.
- **Multi-architecture builds** — can be added later with `docker buildx`.

---

## Verification

After implementation, verify:
1. `docker compose up` starts the backend successfully
2. `curl http://localhost:3000/api/v1/health` returns a healthy response
3. Editing a file in `webapi/src/` triggers hot reload inside the container
4. `docker compose down && docker compose up` preserves the database
5. `docker compose down -v && docker compose up` starts with a fresh database
6. (Optional) `docker compose --profile web up` serves Flutter web at `http://localhost:8080`
